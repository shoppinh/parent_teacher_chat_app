import { HttpService } from '@nestjs/axios';
import { AcceptType } from '../../../shared/type/type';
import { firstValueFrom } from 'rxjs';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UMenuService } from './umenu.service';
import { printLog } from '../../../shared/util';

const defaultHeader = {
  Accept: AcceptType.json,
  'Content-Type': AcceptType.json,
};

const formHeader = {
  Accept: AcceptType.formData,
  'Content-Type': AcceptType.formData,
};

const urlEncodeHeader = {
  Accept: AcceptType.formData,
  'Content-Type': AcceptType.urlEncode,
};

@Injectable()
export class ApiClientService {
  config: any;
  headers: any;
  private localeCode: string = 'en';
  private baseUrl: string = process.env.UMENU_API_BASE_URL;
  private tokens: any;

  constructor(
    private readonly _httpService: HttpService,
    @Inject(forwardRef(() => UMenuService))
    private readonly umenusService: UMenuService,
  ) {}

  async setLocale(localeCode) {
    this.localeCode = localeCode;
  }

  async configHeader(isAuth: boolean = true): Promise<any> {
    const localeHeader = { locale: this.localeCode };
    this.tokens = isAuth ? await this.umenusService.getUMenuLoginToken() : null;
    const authHeader =
      this.tokens?.token && this.tokens.token?.trim() ? { Authorization: 'Bearer ' + this.tokens.token } : null;

    this.config = {
      validateStatus: () => true,
    };
    this.headers = {
      ...defaultHeader,
      ...localeHeader,
      ...authHeader,
    };
    return this.headers;
  }

  async get(url: string, body?: any, option?: any, isAuth: boolean = true): Promise<any> {
    option = option || {};
    const { headers, ...rest } = option;
    return await firstValueFrom(
      this._httpService.get(this.baseUrl + url, {
        ...this.config,
        params: {
          ...body,
        },
        headers: {
          ...(await this.configHeader(isAuth)),
          ...headers,
        },
        ...rest,
      }),
    );
  }

  async post(url: string, body?: any, option?: any, isAuth: boolean = true): Promise<any> {
    option = option || {};
    const { headers, ...rest } = option;
    return await firstValueFrom(
      this._httpService.post(this.baseUrl + url, body, {
        ...this.config,
        headers: {
          ...(await this.configHeader(isAuth)),
          ...headers,
        },
        ...rest,
      }),
    );
  }

  async delete(url: string, body?: any, option?: any): Promise<any> {
    option = option || {};
    const { headers, ...rest } = option;
    return await firstValueFrom(
      this._httpService.delete(this.baseUrl + url, {
        ...this.config,
        headers: {
          ...(await this.configHeader()),
          ...headers,
        },
        data: JSON.stringify(body),
        ...rest,
      }),
    );
  }

  async put(url: string, body?: any, option?: any): Promise<any> {
    option = option || {};
    const { headers, ...rest } = option;

    return await firstValueFrom(
      this._httpService.put(this.baseUrl + url, body, {
        ...this.config,
        headers: {
          ...(await this.configHeader()),
          ...headers,
        },
        ...rest,
      }),
    );
  }

  async patch(url: string, body?: any, option?: any): Promise<any> {
    option = option || {};
    const { headers, ...rest } = option;

    return await firstValueFrom(
      this._httpService.patch(this.baseUrl + url, body, {
        ...this.config,
        headers: {
          ...(await this.configHeader()),
          ...headers,
        },
        ...rest,
      }),
    );
  }

  async postForm(url: string, body?: any, option?: any): Promise<any> {
    option = option || {};
    const { headers, ...rest } = option;

    const result = await firstValueFrom(
      this._httpService.post(this.baseUrl + url, body, {
        ...this.config,
        headers: {
          ...(await this.configHeader()),
          ...formHeader,
          ...headers,
        },
        ...rest,
      }),
    );
    return result;
  }

  async postURLEncode(url: string, body?: any, option?: any): Promise<any> {
    option = option || {};
    const { headers, ...rest } = option;

    const result = await firstValueFrom(
      this._httpService.post(this.baseUrl + url, body, {
        ...this.config,
        headers: {
          ...(await this.configHeader()),
          ...urlEncodeHeader,
          ...headers,
        },
        ...rest,
      }),
    );
    return result;
  }
}

export default ApiClientService;
