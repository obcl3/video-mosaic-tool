export interface MosaicArea {
  id: number
  x: number
  y: number
  width: number
  height: number
}

export interface ProcessingOptions {
  mosaicAreas: MosaicArea[]
  mosaicSize: number
  videoFile: File
}
