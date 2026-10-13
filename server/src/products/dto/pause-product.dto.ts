import { IsString, MaxLength } from 'class-validator';

/** Body for pausing a product: a note is required so the reason is recorded. */
export class PauseProductDto {
  @IsString()
  @MaxLength(500)
  pauseNote: string;
}
