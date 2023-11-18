import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Max, Min } from 'class-validator';

export class BaseSummonerDto {
  @ApiProperty()
  @IsOptional()
  queueId?: number;
}

export class PaginationDto extends BaseSummonerDto {
  @ApiProperty({ default: 0 })
  @IsOptional()
  start?: number;

  @ApiProperty({ default: 20 })
  @IsOptional()
  count?: number;
}

export class SummonerDto {
  summonerName: string;
  championUsed: number;
  winStatus: boolean;
  kda: number;
  kills: number;
  deaths: number;
  assists: number;
  csPerMinute: number;
  runes: any; // Adjust the type accordingly
  spells: number[]; // Assuming spell IDs are numbers
}

export class createSummonerDto {
  summonerId: string;

  summonerName: string;

  leaguePoints: string;

  wins: string;

  losses: string;
}
