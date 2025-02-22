import type { ReactElement } from 'react';
import React from 'react';
import type { Currency } from './amountTokens';
import {
  amountFontSizes,
  getCurrencyAbbreviations,
  currencyPrefixMapping,
  affixFontSizes,
  amountLineHeights,
} from './amountTokens';
import { BaseText } from '~components/Typography/BaseText';
import type { Feedback } from '~tokens/theme/theme';
import type { BaseTextProps } from '~components/Typography/BaseText/types';
import BaseBox from '~components/Box/BaseBox';
import type { TestID } from '~utils/types';
import { getPlatformType } from '~utils';
import { metaAttribute, MetaConstants } from '~utils/metaAttribute';
import { getStyledProps } from '~components/Box/styledProps';
import type { StyledPropsBlade } from '~components/Box/styledProps';
import { assignWithoutSideEffects } from '~utils/assignWithoutSideEffects';
import { throwBladeError } from '~utils/logger';

type AmountProps = {
  /**
   * The value to be rendered within the component.
   *
   */
  value: number;
  /**
   * Sets the intent of the amount.
   *
   * @default undefined
   */
  intent?: Exclude<Feedback, 'neutral'>;
  /**
   * Sets the size of the amount.
   *
   * @default 'body-medium'
   */
  size?:
    | 'body-medium-bold'
    | 'body-small'
    | 'body-small-bold'
    | 'body-medium'
    | 'body-medium-bold'
    | 'heading-small'
    | 'heading-small-bold'
    | 'heading-large'
    | 'heading-large-bold'
    | 'title-small'
    | 'title-medium';
  /**
   * Indicates what the suffix of amount should be
   *
   * @default 'decimals'
   */
  suffix?: 'decimals' | 'none' | 'humanize';
  /**
   * Makes the prefix symbol and decimal digits small and faded
   *
   * @default true
   */
  isAffixSubtle?: true | false;
  /**
   * Prefix to be shown before the amount value. The prefix can be either a currency symbol or a currency code.
   *
   * @default 'currency-symbol'
   */
  prefix?: 'currency-symbol' | 'currency-code';
  /**
   * The currency of the amount.  Note that this component
   * only displays the provided value in the specified currency, it does not perform any currency conversion.
   *
   * @default 'INR'
   * */
  currency?: Currency;
} & TestID &
  StyledPropsBlade;

type ColorProps = {
  amountValueColor: BaseTextProps['color'];
  affixColor: BaseTextProps['color'];
};

const getTextColorProps = ({ intent }: { intent: AmountProps['intent'] }): ColorProps => {
  const props: ColorProps = {
    amountValueColor: 'surface.text.normal.lowContrast',
    affixColor: 'surface.text.muted.lowContrast',
  };
  if (!intent) return props;
  props.amountValueColor = `feedback.text.${intent}.lowContrast`;
  props.affixColor = `feedback.text.${intent}.lowContrast`;
  return props;
};

interface AmountValue extends Omit<AmountProps, 'value'> {
  affixColor: BaseTextProps['color'];
  amountValueColor: BaseTextProps['color'];
  value: string;
  size: Exclude<AmountProps['size'], undefined>;
}

const AmountValue = ({
  value,
  size,
  amountValueColor,
  isAffixSubtle,
  suffix,
  affixColor,
}: AmountValue): ReactElement => {
  const affixFontWeight = isAffixSubtle ? 'regular' : 'bold';
  const isReactNative = getPlatformType() === 'react-native';
  const affixFontSize = isAffixSubtle ? affixFontSizes[size] : amountFontSizes[size];
  const valueForWeight = size.includes('bold') || size.startsWith('title') ? 'bold' : 'regular';
  if (suffix === 'decimals' && isAffixSubtle) {
    const integer = value.split('.')[0];
    const decimal = value.split('.')[1];

    // Native does not support alignItems of Text inside a div, insted we need to wrap is in a Text
    const AmountWrapper = getPlatformType() === 'react-native' ? BaseText : React.Fragment;

    return (
      <AmountWrapper>
        <BaseText
          fontSize={amountFontSizes[size]}
          fontWeight={valueForWeight}
          lineHeight={amountLineHeights[size]}
          color={amountValueColor}
          as={isReactNative ? undefined : 'span'}
        >
          {integer}.
        </BaseText>
        <BaseText
          marginLeft="spacing.1"
          fontWeight={affixFontWeight}
          fontSize={affixFontSize}
          color={affixColor}
          as={isReactNative ? undefined : 'span'}
        >
          {decimal || '00'}
        </BaseText>
      </AmountWrapper>
    );
  }
  return (
    <BaseText
      fontSize={amountFontSizes[size]}
      fontWeight={valueForWeight}
      color={amountValueColor}
      lineHeight={amountLineHeights[size]}
    >
      {value}
    </BaseText>
  );
};

// This function rounds a number to a specified number of decimal places
// and floors the result.
export const getFlooredFixed = (value: number, decimalPlaces: number): number => {
  const factor = 100 ** decimalPlaces;
  const roundedValue = Math.floor(value * factor) / factor;
  return Number(roundedValue.toFixed(decimalPlaces));
};

export const addCommas = (amountValue: number, currency: Currency, decimalPlaces = 0): string => {
  // If the currency is 'INR', set the locale to 'en-IN' (Indian English).
  // Otherwise, set the locale to 'en-US' (U.S. English).
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return amountValue.toLocaleString(locale, { minimumFractionDigits: decimalPlaces });
};
/**
 * This function returns the humanized amount
 * ie: for INR 2000 => 2K
 * for MYR 2000000 => 2M
 */
export const getHumanizedAmount = (amountValue: number, currency: Currency): string => {
  const abbreviations = getCurrencyAbbreviations(currency);

  const abbreviation = abbreviations.find((abbr) => amountValue >= abbr.value);
  if (abbreviation) {
    amountValue = amountValue / abbreviation.value;
    const formattedAmountValue = getFlooredFixed(amountValue, 2);
    return addCommas(formattedAmountValue, currency) + abbreviation.symbol;
  } else {
    return amountValue.toString();
  }
};

type FormatAmountWithSuffixType = {
  suffix: AmountProps['suffix'];
  value: number;
  currency: Currency;
};

export const formatAmountWithSuffix = ({
  suffix,
  value,
  currency,
}: FormatAmountWithSuffixType): string => {
  switch (suffix) {
    case 'decimals': {
      const decimalNumber = getFlooredFixed(value, 2);
      return addCommas(decimalNumber, currency, 2);
    }
    case 'humanize': {
      return getHumanizedAmount(value, currency);
    }
    case 'none': {
      return addCommas(getFlooredFixed(value, 0), currency);
    }
    default:
      return addCommas(getFlooredFixed(value, 0), currency);
  }
};

const getCurrencyWeight = (
  isAffixSubtle: NonNullable<AmountProps['isAffixSubtle']>,
  size: NonNullable<AmountProps['size']>,
): 'bold' | 'regular' => {
  if (isAffixSubtle || size.startsWith('bold')) return 'bold';
  return 'regular';
};

const _Amount = ({
  value,
  suffix = 'decimals',
  size = 'body-medium',
  isAffixSubtle = true,
  intent,
  prefix = 'currency-symbol',
  testID,
  currency = 'INR',
  ...styledProps
}: AmountProps): ReactElement => {
  if (__DEV__) {
    if (typeof value !== 'number') {
      throwBladeError({
        message: '`value` prop must be of type `number` for Amount.',
        moduleName: 'Amount',
      });
    }
    // @ts-expect-error neutral intent should throw error
    if (intent === 'neutral') {
      throwBladeError({
        message: '`neutral` intent is not supported.',
        moduleName: 'Amount',
      });
    }
  }

  const currencyPrefix = currencyPrefixMapping[currency][prefix];
  const renderedValue = formatAmountWithSuffix({ suffix, value, currency });
  const { amountValueColor, affixColor } = getTextColorProps({
    intent,
  });

  const currencyColor = isAffixSubtle ? affixColor : amountValueColor;
  const currencyFontSize = isAffixSubtle ? affixFontSizes[size] : amountFontSizes[size];
  const currencyWeight = getCurrencyWeight(isAffixSubtle, size);
  const isReactNative = getPlatformType() === 'react-native';

  return (
    <BaseBox
      display={(isReactNative ? 'flex' : 'inline-flex') as never}
      {...metaAttribute({ name: MetaConstants.Amount, testID })}
      {...getStyledProps(styledProps)}
    >
      <BaseBox
        display={(isReactNative ? 'flex' : 'inline-flex') as never}
        alignItems="baseline"
        flexDirection="row"
      >
        <BaseText
          marginRight="spacing.1"
          fontWeight={currencyWeight}
          fontSize={currencyFontSize}
          color={currencyColor}
          as={isReactNative ? undefined : 'span'}
        >
          {currencyPrefix}
        </BaseText>
        <AmountValue
          value={renderedValue}
          amountValueColor={amountValueColor}
          size={size}
          isAffixSubtle={isAffixSubtle}
          suffix={suffix}
          affixColor={affixColor}
        />
      </BaseBox>
    </BaseBox>
  );
};

const Amount = assignWithoutSideEffects(_Amount, {
  displayName: 'Amount',
  componentId: 'Amount',
});

export type { AmountProps };
export { Amount };
