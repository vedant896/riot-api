import { CustomRepository } from 'src/customRepo/typeorm-ex.decorator';
import { Repository } from 'typeorm';
import { Summoner } from './entities/summoner.entity';

@CustomRepository(Summoner)
export class SummonerRepository extends Repository<Summoner> {
  createSummoner(createSummoner) {
    return this.upsert(createSummoner, ['summonerId']);
  }
  async getLeaderBoard(field: string) {
    const data = await this.createQueryBuilder()
      .select('*')
      .addSelect(`ROW_NUMBER () OVER (ORDER BY ${field} DESC)`)

      .getRawMany();
    return data;
  }
}
