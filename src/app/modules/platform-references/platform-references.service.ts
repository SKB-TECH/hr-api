import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import slugify from 'slugify';
import { Skill } from '../candidate/candidate-skill/entities/skill.entity';
import { SkillCategory } from '../candidate/candidate-skill/entities/skill-category.entity';
import {
  PlatformReference,
  PlatformReferenceType,
} from './entities/platform-reference.entity';
import { CreatePlatformReferenceDto } from './dto/platform-reference.dto';
import { JobCategory } from '@/utils/enums';

type ExcelRow = Record<string, unknown>;
export type ImportCatalog =
  | 'countries'
  | 'languages'
  | 'skills'
  | 'skill-categories';

@Injectable()
export class PlatformReferencesService {
  constructor(
    @InjectRepository(PlatformReference)
    private readonly references: Repository<PlatformReference>,
    private readonly dataSource: DataSource,
  ) {}

  list(
    type: PlatformReferenceType,
    q?: string,
    limit = 30,
    includeInactive = false,
  ) {
    return this.references.find({
      where: {
        type,
        ...(q ? { name: ILike(`%${q}%`) } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      order: { name: 'ASC' },
      take: limit,
    });
  }

  async upsert(type: PlatformReferenceType, dto: CreatePlatformReferenceDto) {
    const code = this.code(dto.code);
    let item = await this.references.findOne({ where: { type, code } });
    item = item
      ? this.references.merge(item, { ...dto, code, isActive: true })
      : this.references.create({ ...dto, type, code, isActive: true });
    return this.references.save(item);
  }

  async disable(id: string) {
    const item = await this.references.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Reference item not found');
    item.isActive = false;
    return this.references.save(item);
  }

  async importWorkbook(file: Express.Multer.File, only?: ImportCatalog) {
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(file.buffer, { type: 'buffer' });
    } catch {
      throw new BadRequestException('Invalid Excel workbook');
    }

    const sheet = (names: string[], catalog?: ImportCatalog) => {
      const actual = workbook.SheetNames.find((name) =>
        names.includes(name.trim().toLowerCase()),
      );
      const selected =
        actual || (only === catalog ? workbook.SheetNames[0] : '');
      return selected
        ? XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[selected], {
            defval: '',
          })
        : [];
    };

    const skills =
      !only || only === 'skills'
        ? sheet(['skills', 'compétences', 'competences'], 'skills')
        : [];
    const skillCategories =
      !only || only === 'skill-categories'
        ? sheet(
            [
              'skill categories',
              'skill_categories',
              'catégories compétences',
              'categories competences',
            ],
            'skill-categories',
          )
        : [];
    const countries =
      !only || only === 'countries'
        ? sheet(['countries', 'pays'], 'countries')
        : [];
    const languages =
      !only || only === 'languages'
        ? sheet(['languages', 'langues'], 'languages')
        : [];
    const categories = sheet([
      'job categories',
      'job_categories',
      'catégories emploi',
      'categories emploi',
    ]);
    const benefits = sheet(['benefits', 'avantages', 'bénéfices', 'benefices']);
    if (
      ![
        skills,
        skillCategories,
        countries,
        languages,
        categories,
        benefits,
      ].some((rows) => rows.length)
    ) {
      throw new BadRequestException(
        'Workbook does not contain a supported sheet or any data rows',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const referenceRepo = manager.getRepository(PlatformReference);
      const skillRepo = manager.getRepository(Skill);
      const categoryRepo = manager.getRepository(SkillCategory);
      const result = {
        skills: 0,
        skillCategories: 0,
        countries: 0,
        languages: 0,
        jobCategories: 0,
        benefits: 0,
      };

      for (const row of skillCategories) {
        const name = this.value(row, [
          'name',
          'nom',
          'category',
          'categorie',
          'catégorie',
        ]);
        if (!name) continue;
        const existing = await categoryRepo.findOne({
          where: { name: ILike(name) },
        });
        if (!existing) await categoryRepo.save(categoryRepo.create({ name }));
        result.skillCategories++;
      }

      for (const row of skills) {
        const name = this.value(row, ['name', 'nom', 'skill']);
        const categoryName = this.value(row, [
          'category',
          'categorie',
          'catégorie',
        ]);
        if (!name || !categoryName) continue;
        let category = await categoryRepo.findOne({
          where: { name: ILike(categoryName) },
        });
        if (!category)
          category = await categoryRepo.save(
            categoryRepo.create({ name: categoryName }),
          );
        const slug = slugify(name, { lower: true, strict: true });
        const existing = await skillRepo.findOne({
          where: [{ name: ILike(name) }, { slug }],
        });
        await skillRepo.save(
          existing
            ? skillRepo.merge(existing, { name, slug, categoryId: category.id })
            : skillRepo.create({ name, slug, categoryId: category.id }),
        );
        result.skills++;
      }

      const importReferences = async (
        rows: ExcelRow[],
        type: PlatformReferenceType,
        counter: 'countries' | 'languages' | 'jobCategories' | 'benefits',
      ) => {
        for (const row of rows) {
          const name = this.value(row, ['name', 'nom', 'title', 'titre']);
          if (!name) continue;
          const code = this.code(this.value(row, ['code', 'slug']) || name);
          if (
            type === PlatformReferenceType.JOB_CATEGORY &&
            !Object.values(JobCategory).includes(code as JobCategory)
          ) {
            throw new BadRequestException(
              `Unsupported job category code '${code}'. Allowed codes: ${Object.values(JobCategory).join(', ')}`,
            );
          }
          const values = {
            type,
            code,
            name,
            description: this.value(row, ['description']) || null,
            icon: this.value(row, ['icon', 'icone', 'icône']) || null,
            metadata: {},
            isActive: true,
          };
          const existing = await referenceRepo.findOne({
            where: { type, code },
          });
          await referenceRepo.save(
            existing
              ? referenceRepo.merge(existing, values)
              : referenceRepo.create(values),
          );
          result[counter]++;
        }
      };

      await importReferences(
        countries,
        PlatformReferenceType.COUNTRY,
        'countries',
      );
      await importReferences(
        languages,
        PlatformReferenceType.LANGUAGE,
        'languages',
      );
      await importReferences(
        categories,
        PlatformReferenceType.JOB_CATEGORY,
        'jobCategories',
      );
      await importReferences(
        benefits,
        PlatformReferenceType.BENEFIT,
        'benefits',
      );
      return result;
    });
  }

  private value(row: ExcelRow, accepted: string[]) {
    const entry = Object.entries(row).find(([key]) =>
      accepted.includes(key.trim().toLowerCase()),
    );
    return entry ? String(entry[1]).trim() : '';
  }

  private code(value: string) {
    return slugify(value, {
      lower: false,
      strict: true,
      replacement: '_',
    }).toUpperCase();
  }
}
