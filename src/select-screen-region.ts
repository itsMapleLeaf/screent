import { execa } from "execa"

export type Region = {
  left: number
  top: number
  width: number
  height: number
}

export async function selectScreenRegion(): Promise<Region> {
  const result = await execa("slop", [
    "--highlight",
    "--color=0.3,0.4,0.6,0.4",
    `--format={ "left": %x, "top": %y, "width": %w, "height": %h }`,
  ])
  return JSON.parse(result.stdout)
}
