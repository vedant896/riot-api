import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'summoner' })
export class Summoner extends BaseEntity {
  @Column({ name: 'summoner_id', unique: true })
  summonerId: string;

  @Column({ name: 'summoner_name' })
  summonerName: string;

  @Column({ name: 'league_points' })
  leaguePoints: string;

  @Column({ name: 'wins' })
  wins: string;

  @Column({ name: 'win_rate' })
  win_rate: string;

  @Column({ name: 'losses' })
  losses: string;
}
