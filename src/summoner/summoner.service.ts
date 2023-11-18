// summoner.service.ts

import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Observable, lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { SummonerDto, createSummonerDto } from './dto/summoner.dto';
import { Rank } from './enum/summoner.enum';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SummonerRepository } from './summoner.repository';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class SummonerService {
  constructor(
    private httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private summonerRepo: SummonerRepository,
    @InjectQueue('summoner') private summonerQueue: Queue,
  ) {}

  private apiKey = process.env.RIOT_API_KEY;

  async getSummonerInfo(summonerName: string, region: string) {
    try {
      const url = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}?api_key=${this.apiKey}`;
      const data = await lastValueFrom(this.httpService.get(url));

      return data.data;
    } catch (error) {
      throw new HttpException(error.message, error.status_code);
    }
  }

  async getRecentMatches(
    puuId: string,
    queueId: number,
    start: number,
    count: number,
  ) {
    try {
      const url = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuId}/ids?count=${count}&queue=${queueId}&api_key=${this.apiKey}`;

      const data = await lastValueFrom(this.httpService.get(url));

      return data.data;
    } catch (error) {
      throw new HttpException(error.message, error.status_code);
    }
  }

  async getMatchDetails(matchId: number) {
    try {
      const url = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${this.apiKey}`;
      const data = await lastValueFrom(this.httpService.get(url));

      return data.data.info;
    } catch (error) {
      throw new HttpException(error.message, error.status_code);
    }
  }

  async getRankedInfo(summonerId: string, region: string) {
    try {
      const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${this.apiKey}`;
      const data = await lastValueFrom(this.httpService.get(url));

      return data.data;
    } catch (error) {
      throw new HttpException(error.message, error.status_code);
    }
  }

  async getRecentMatchsSummery(
    summonerName: string,
    region: string,
    queueId: number = 440,
    start: number = 0,
    count: number = 1,
  ) {
    try {
      const key = `${summonerName}/:region/recent-matches${queueId}`;
      const cacheData = await this.cacheManager.get(key);
      if (cacheData) return cacheData;
      const summonerInfo = await this.getSummonerInfo(summonerName, region);

      const recentMatches = await this.getRecentMatches(
        summonerInfo['puuid'],
        queueId,
        start,
        count,
      );
      const summonerData: SummonerDto[] = [];
      const matchDetails = await Promise.all(
        recentMatches.map(async (matchId) => {
          return await this.getMatchDetails(matchId);
        }),
      );

      matchDetails.forEach((matchDetail) => {
        const participant = matchDetail.participants.find(
          (p) => p.puuid === summonerInfo['puuid'],
        );
        const stats = participant;

        const csPerMinute =
          (stats?.totalMinionsKilled || 0 + stats?.neutralMinionsKilled || 0) /
          (matchDetail.gameDuration / 60);

        const summonerDto: SummonerDto = {
          summonerName: summonerName,
          championUsed: participant.championId,
          winStatus: stats.win,
          kills: stats.kills,
          kda: stats.challenges.kda,
          deaths: stats.deaths,
          assists: stats.assists,
          csPerMinute: csPerMinute,
          runes: participant.runes,
          spells: [participant.spell1Id, participant.spell2Id],
        };

        summonerData.push(summonerDto);
      });
      this.cacheManager.set(key, summonerData, { ttl: 2000 });
      return summonerData;
    } catch (error) {
      throw new HttpException(error.message, error.status_code);
    }
  }
  async getSummonerSummery(
    summonerName: string,
    region: string,
    queueId: number = 420,
  ) {
    try {
      const key = `${summonerName}/:${region}/summary${queueId}`;
      const cacheData = await this.cacheManager.get(key);

      if (cacheData) return cacheData;
      const summonerInfo = await this.getSummonerInfo(summonerName, region);

      const rankInfo = await this.getRankedInfo(summonerInfo['id'], region);
      //////////
      await this.summonerQueue.add('process-summoner', {
        summonerInfo: {
          summonerId: summonerInfo['id'],
          summonerName: summonerName,
        },
        rankInfo,
      });
      const recentMatches = await this.getRecentMatches(
        summonerInfo['puuid'],
        queueId,
        0,
        1,
      );
      const summonerData = [];
      const matchDetails = await Promise.all(
        recentMatches.map(async (matchId) => {
          return await this.getMatchDetails(matchId);
        }),
      );

      matchDetails.forEach((matchDetail) => {
        const participant = matchDetail.participants.find(
          (p) => p.puuid === summonerInfo['puuid'],
        );
        const stats = participant;

        const csPerMinute =
          (stats?.totalMinionsKilled || 0 + stats?.neutralMinionsKilled || 0) /
          (matchDetail.gameDuration / 60);

        const summonerDto = {
          summonerName: summonerName,
          queueId: matchDetail.queueId,
          kills: stats.kills,
          kda: stats.challenges.kda,
          deaths: stats.deaths,
          assists: stats.assists,
          csPerMinute: csPerMinute,
          visionScore: stats.visionScore,
        };

        summonerData.push(summonerDto);
      });

      const rankData = {};
      for (let ele of summonerData) {
        if (rankData[ele.queueId]) {
          rankData[ele.queueId] = {
            csPerMinute: ele.csPerMinute + rankData[ele.queueId].csPerMinute,
            visionScore: ele.visionScore + rankData[ele.queueId].visionScore,
            kda: ele.kda + rankData[ele.queueId].kda,
            count: 1 + rankData[ele.queueId].count,
          };
        } else {
          rankData[ele.queueId] = {
            csPerMinute: ele.csPerMinute,
            kda: ele.kda,
            visionScore: ele.visionScore,
            count: 1,
          };
        }
      }
      for (let ele of rankInfo) {
        if (rankData[Rank[ele.queueType]] && +Rank[ele.queueType] == queueId) {
          ele.avgCsPerMinute =
            rankData[Rank[ele.queueType]].csPerMinute /
            rankData[Rank[ele.queueType]].count;
          ele.avgVisionScore =
            rankData[Rank[ele.queueType]].visionScore /
            rankData[Rank[ele.queueType]].count;
          ele.kda =
            rankData[Rank[ele.queueType]].kda /
            rankData[Rank[ele.queueType]].count;
          this.cacheManager.set(key, ele, { ttl: 2000 });
          return ele;
        }
      }

      this.cacheManager.set(key, rankInfo, { ttl: 2000 });
      return rankInfo;
    } catch (error) {
      throw new HttpException(error.message, error.status_code);
    }
  }

  async getLeaderBoard(summonerName: string, region: string) {
    try {
      const key = `leaderboard/:${summonerName}/:${region}`;
      const cacheData = await this.cacheManager.get(key);
      if (cacheData) return cacheData;
      else {
        const summonerInfo = await this.getSummonerInfo(summonerName, region);
        const league_points = await this.summonerRepo.getLeaderBoard(
          'league_points',
        );
        const win_rateD = await this.summonerRepo.getLeaderBoard('win_rate');
        let leagueTop = 0;
        let winRateTop = 0;
        for (let ind in league_points) {
          if (league_points[ind].summoner_id == summonerInfo['id'])
            leagueTop = league_points[ind].row_number;
          if (win_rateD[ind].summoner_id == summonerInfo['id'])
            winRateTop = win_rateD[ind].row_number;
        }

        const result = {
          leaguePoints: { top: leagueTop },
          winRate: { top: winRateTop },
        };
        this.cacheManager.set(key, result, { ttl: 2000 });
        return result;
      }
    } catch (error) {
      throw new HttpException(error.message, error.status_code);
    }
  }
}
