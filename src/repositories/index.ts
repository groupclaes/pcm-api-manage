export interface IRepositoryResult {
  error: string
  verified: boolean
  result: any
}

export interface IRepositoryBooleanResult extends IRepositoryResult {
  result: boolean
}