// // src/watchlist/entities/watchlist.entity.ts
// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   CreateDateColumn,
//   UpdateDateColumn,
// } from 'typeorm';

// @Entity()
// export class Watchlist {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column({ unique: true })
//   symbol: string;

//   @Column('jsonb', { nullable: true })
//   stockData: any; // This will store all the Yahoo finance data

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;
// }
