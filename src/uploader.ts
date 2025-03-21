import { PluginSettings } from "./setting";
import { App, TFile, Notice } from "obsidian";

// 添加返回值类型接口
interface UploadResponse {
  code: number;
  msg: string;
  data: string;
  fullResult?: Array<any>;
}

//兰空上传器
export class LskyProUploader {
  settings: PluginSettings;
  lskyUrl: string;
  app: App;

  constructor(settings: PluginSettings, app: App) {
    this.settings = settings;
    this.lskyUrl = this.settings.uploadServer.endsWith("/")
      ? this.settings.uploadServer + "api/v1/upload"
      : this.settings.uploadServer + "/api/v1/upload";
    this.app = app;
  }

  //上传请求配置
  getRequestOptions(file: File) {
    let headers = new Headers();
    // 严格检查 token
    if (!this.settings.token || this.settings.token.trim() === '') {
      throw new Error('请先配置 Token');
    }
    
    
    
    // 设置认证头
    const authHeader = `Bearer ${this.settings.token.trim()}`;
    headers.append("Authorization", authHeader);
    
   
    
    headers.append("Accept", "application/json");

    let formdata = new FormData();
    formdata.append("file", file);
    
    // 添加策略ID（如果有）
    if (this.settings.strategy_id) {
      formdata.append("strategy_id", this.settings.strategy_id);
    }
    
    // 添加权限设置
    formdata.append("permission", this.settings.isPublic ? "1" : "0");
    
    // 添加相册ID（如果有）
    if (this.settings.albumId) {
      formdata.append("album_id", this.settings.albumId);
    }


    return {
      method: "POST",
      headers: headers,
      body: formdata,
    };
  }

  // 修改重试逻辑，增加对 401 的处理
  async retryFetch(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        
        // 如果是认证错误，直接抛出错误不重试
        if (response.status === 401) {
          throw new Error('Token 无效或已过期，请检查配置');
        }
        
        // 对其他错误进行重试
        if (response.ok || response.status !== 403) {
          return response;
        }
        
        // 如果是 403 错误，等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      } catch (error) {
        if (i === maxRetries - 1 || error.message.includes('Token')) {
          throw error;
        }
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error(`Failed after ${maxRetries} retries`);
  }

  //上传文件，返回promise对象
  async promiseRequest(file: any): Promise<UploadResponse> {
    try {
      let requestOptions = this.getRequestOptions(file);
      const response = await this.retryFetch(this.lskyUrl, requestOptions);
      const value = await response.json();
      
      if (!value.status) {
        const errorMsg = value.message || '上传失败';
        new Notice(`上传失败: ${errorMsg}`);
        return {
          code: -1,
          msg: errorMsg,
          data: value.data,
          fullResult: []
        };
      }
      
      return {
        code: 0,
        msg: "success",
        data: value.data?.links?.url,
        fullResult: []
      };
      
    } catch (error) {
      console.error("Upload error:", error);
      new Notice(error.message || '上传出错');
      return {
        code: -1,
        msg: error.message || '上传失败',
        data: "",
        fullResult: []
      };
    }
  }

  //通过路径创建文件
  async createFileObjectFromPath(path: string) {
    return new Promise(resolve => {
      if(path.startsWith('https://') || path.startsWith('http://')){
        return fetch(path).then(response => {
          return response.blob().then(blob => {
            resolve(new File([blob], path.split("/").pop()));
          });
        });
      }
      let obsfile = this.app.vault.getAbstractFileByPath(path);
      //@ts-ignore
      this.app.vault.readBinary(obsfile).then(data=>{
        const fileName = path.split("/").pop(); // 获取文件名
        const fileExtension = fileName.split(".").pop(); // 获取后缀名
        const blob = new Blob([data], { type: "image/" + fileExtension });
        const file = new File([blob], fileName);
        resolve(file);
      }).catch(err=>{
        console.error("Error reading file:", err);
        return;
      });
    });
  }

  async uploadFilesByPath(fileList: Array<String>): Promise<any> {
    let promiseArr = fileList.map(async filepath => {
      let file = await this.createFileObjectFromPath(filepath.format());
      return this.promiseRequest(file);
    });
    try {
      let reurnObj = await Promise.all(promiseArr);
      return {
        result: reurnObj.map((item: { data: string }) => item.data),
        success: true,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }
  async uploadFiles(fileList: Array<File>): Promise<any> {
    let promiseArr = fileList.map(async file => {
      return this.promiseRequest(file);
    });
    try {
      let reurnObj = await Promise.all(promiseArr);
      let failItem:any = reurnObj.find((item: { code: number })=>item.code===-1);
      if (failItem) {
        throw {err:failItem.msg}
      }
      return {
        result: reurnObj.map((item: { data: string }) => item.data),
        success: true,
      };
    } catch (error) {
      return {
        success: false,
      };
    }
  }
  async uploadFileByClipboard(evt: ClipboardEvent): Promise<any> {
    let files = evt.clipboardData.files;
    let file = files[0];
    return this.promiseRequest(file);
  }
}