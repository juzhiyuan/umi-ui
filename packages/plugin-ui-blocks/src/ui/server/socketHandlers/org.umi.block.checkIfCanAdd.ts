import { existsSync } from 'fs';
import { join } from 'path';
import { IHandlerOpts } from '../index';

export default function({ success, payload, api, lang, failure }: IHandlerOpts) {
  const { item } = payload as {
    item: {
      features: string[];
    };
    type: string;
  };

  /**
   * 是不是有这个 feature tag
   * @param feature
   */
  function haveFeature(feature) {
    return item.features && item.features.includes(feature);
  }

  // 获取最后生成的路由
  const configRoutes = Array.isArray(api.config?.routes) && api.config?.routes?.length > 0;
  // 不支持约定式路由
  if (!configRoutes) {
    failure({
      message:
        lang === 'zh-CN'
          ? '区块添加暂不支持约定式路由，请先转成配置式路由。'
          : 'The block adding does not support the conventional route, please convert to a configuration route.',
    });
    return;
  }

  const payloadType = (payload as { type: string }).type === 'block' ? '区块' : '模板';
  const isBigfish = !!process.env.BIGFISH_COMPAT;

  // 提前判断是否有 package.json，区块添加时如果没有会报错
  if (!existsSync(join(api.cwd, 'package.json'))) {
    failure({
      message:
        lang === 'zh-CN'
          ? `${payloadType}添加需要在项目根目录有 package.json`
          : `package.json is required to add ${payloadType}`,
    });
    return;
  }
  const checkConfigRules = {
    dva: {
      // 解决插件封装里开启 dva 的情况
      enable: api.config?.dva,
      message: {
        'zh-CN': isBigfish
          ? `${payloadType}依赖 dva，请开启 dva 配置。`
          : `${payloadType}依赖 dva，请安装 @umijs/preset-react 插件并开启 dva 。`,
        'en-US': isBigfish
          ? ''
          : 'Block depends on dva, please install @umijs/preset-react and enable dva.',
      },
    },
    i18n: {
      enable: api.config.locale,
      message: {
        'zh-CN': isBigfish
          ? `${payloadType}依赖 locale，请开启 locale 配置。`
          : `${payloadType}依赖国际化（i18n），请安装 @umijs/preset-react 插件并开启 locale 。`,
        'en-US': isBigfish
          ? ''
          : 'Block depends on i18n, please install @umijs/preset-react and enable locale.',
      },
    },
  };

  Object.keys(checkConfigRules).forEach(rule => {
    if (haveFeature(rule) && checkConfigRules[rule] && !checkConfigRules[rule].enable) {
      failure({
        message: checkConfigRules[rule].message[lang] || checkConfigRules[rule].message['zh-CN'],
      });
      return false;
    }
  });

  success({ data: true, success: true });
}
