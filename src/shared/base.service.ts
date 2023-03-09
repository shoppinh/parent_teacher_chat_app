import { BaseEntity } from './base.entity';
import { DeepPartial, Repository } from 'typeorm';

export abstract class BaseService<T extends BaseEntity> {
  protected _repository: Repository<T>;

  /**
   * For using hook purpose, should use this function before creating persistent data
   * @param entity
   */
  async createEntityInstance(entity: DeepPartial<T>): Promise<T> {
    return this._repository.create(entity);
  }

  async create(entity: DeepPartial<T>): Promise<T> {
    return this._repository.create(entity);
  }

  async save(entity: DeepPartial<T>): Promise<T> {
    return this._repository.save(entity);
  }

  async saveAll(entitys: any = []): Promise<T> {
    return this._repository.save(entitys);
  }

  async findAll(): Promise<T[]> {
    return this._repository.find();
  }

  async find(filter = {}): Promise<T[]> {
    return this._repository.find(filter);
  }

  async findAndCount(filter = {}): Promise<[T[], number]> {
    return this._repository.findAndCount(filter);
  }

  async findOne(filter = {}): Promise<T> {
    return this._repository.findOne(filter);
  }

  /**
   * criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindConditions<Entity>
   * @param criteria
   */
  async delete(criteria: any) {
    return this._repository.delete(criteria);
  }

  /**
   * entities: Entity[]
   * @param entities
   */
  async remove(entities: T[]) {
    return this._repository.remove(entities);
  }
}
