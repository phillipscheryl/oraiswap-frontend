/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type HumanAddr = string;

export interface InitMsg {
  commission_rate?: string | null;
  oracle_addr: HumanAddr;
  /**
   * Pair contract code ID, which is used to
   */
  pair_code_id: number;
  token_code_id: number;
  [k: string]: unknown;
}
