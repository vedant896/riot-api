import { Logger } from '@nestjs/common';
import { SummonerRepository } from './summoner.repository';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('summoner')
export class SummonerProcessor {
  constructor(private summonerRepo: SummonerRepository) {}
  private readonly logger = new Logger(SummonerProcessor.name);

  @Process('process-summoner')
  updateSummonerData(job: Job) {
    try {
      this.logger.log('Called when the current second is 45');
      const { summonerInfo, rankInfo } = job.data;
      let summonerData = {
        summonerId: summonerInfo.summonerId,
        summonerName: summonerInfo.summonerName,
        leaguePoints: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
      };
      for (let ele of rankInfo) {
        {
          (summonerData.leaguePoints =
            summonerData.leaguePoints + ele.leaguePoints),
            (summonerData.wins = summonerData.wins + ele.wins),
            (summonerData.losses = summonerData.losses + ele.losses);
        }
      }
      const total_matches = summonerData.wins + summonerData.losses;
      const win_rate = (summonerData.wins / total_matches) * 100 || 0;
      summonerData.win_rate = win_rate;

      this.summonerRepo.createSummoner(summonerData);
    } catch (error) {
      console.log(error);
    }
  }
}
