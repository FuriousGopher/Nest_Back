import { DataSource, EntityManager } from 'typeorm';

export abstract class TransactionBaseUseCase<I, O> {
  protected constructor(protected readonly dataSource: DataSource) {}

  abstract doLogic(input: I, manager: EntityManager): Promise<O>;

  public async execute(command: I) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const res = await this.doLogic(command, queryRunner.manager);
      await queryRunner.commitTransaction();
      return res;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
