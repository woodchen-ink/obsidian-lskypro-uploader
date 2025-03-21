import { extname } from "path";
import { Readable } from "stream";

export interface IStringKeyMap<T> {
  [key: string]: T;
}

const IMAGE_EXT_LIST = [
  ".png",
  ".jpg",
  ".jpeg",
  ".bmp",
  ".gif",
  ".svg",
  ".tiff",
  ".webp",
  ".avif",
];

export function isAnImage(ext: string) {
  return IMAGE_EXT_LIST.includes(ext.toLowerCase());
}
export function isAssetTypeAnImage(path: string): Boolean {
  return isAnImage(extname(path));
}

export async function streamToString(stream: Readable) {
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    chunks.push(new Uint8Array(chunk));
  }

  // 计算总长度
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  
  // 创建一个新的 Uint8Array 并复制所有数据
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(result);
}

export function getUrlAsset(url: string) {
  return (url = url.substring(1 + url.lastIndexOf("/")).split("?")[0]).split(
    "#"
  )[0];
}

export function getLastImage(list: string[]) {
  const reversedList = list.reverse();
  let lastImage;
  reversedList.forEach(item => {
    if (item && item.startsWith("http")) {
      lastImage = item;
      return item;
    }
  });
  return lastImage;
}

interface AnyObj {
  [key: string]: any;
}

export function arrayToObject<T extends AnyObj>(
  arr: T[],
  key: string
): { [key: string]: T } {
  const obj: { [key: string]: T } = {};
  arr.forEach(element => {
    obj[element[key]] = element;
  });
  return obj;
}
