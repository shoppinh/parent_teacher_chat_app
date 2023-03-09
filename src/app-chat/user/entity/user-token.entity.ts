import { BaseEntity } from 'src/shared/base.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class UserTokens extends BaseEntity {
  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false })
  accessToken: string;

  @Column({ nullable: false })
  refreshToken: string;
}
