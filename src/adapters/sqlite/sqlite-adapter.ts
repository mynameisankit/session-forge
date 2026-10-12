import { UUID } from "node:crypto";

interface CreateSessionParams {
  readonly userId: UUID;
  readonly tokenHash: string;
  readonly expiresAt: string;
}

const createSession = ({
  userId,
  tokenHash,
  expiresAt
}: CreateSessionParams) => {
  // const familyId = await this.store.session_families.insert({
  //   user_id: userId,
  //   token_hash: hashedRefreshToken
  // });
  // await this.store.refresh_tokens.insert({
  //   user_id: userId,
  //   token_hash: hashedRefreshToken,
  //   family_id: familyId
  // });

  // return { refreshToken, userId };
}

interface ConsumeAndReplaceParams {

}

const consumeAndReplace = ({
}: ConsumeAndReplaceParams) => {
  // const familyId = await this.store.session_families.insert({
  //   user_id: userId,
  //   token_hash: hashedRefreshToken
  // });
  // await this.store.refresh_tokens.insert({
  //   user_id: userId,
  //   token_hash: hashedRefreshToken,
  //   family_id: familyId
  // });

  // return { refreshToken, userId };
}