// summoner.controller.ts

import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { SummonerService } from './summoner.service';
import { BaseSummonerDto, PaginationDto } from './dto/summoner.dto';

@Controller('summoner')
export class SummonerController {
  constructor(private summonerService: SummonerService) {}

  @Get('/:summonerName/:region/recent-matches')
  getRecentMatches(
    @Param('summonerName') summonerName: string,
    @Param('region') region: string,
    @Query() query: PaginationDto,
  ) {
    return this.summonerService.getRecentMatchsSummery(
      summonerName,
      region,
      query.queueId,
      query.start,
      query.count,
    );
  }

  @Get('/:summonerName/:region/summary')
  getSummonerSummary(
    @Param('summonerName') summonerName: string,
    @Param('region') region: string,
    @Query() queue: BaseSummonerDto,
  ) {
    return this.summonerService.getSummonerSummery(
      summonerName,
      region,
      queue.queueId,
    );
  }
  @Get('/leaderboard/:summonerName/:region')
  getLeaderBoard(
    @Param('summonerName') summonerName: string,
    @Param('region') region: string,
  ) {
    return this.summonerService.getLeaderBoard(summonerName, region);
  }
}
