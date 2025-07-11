declare module 'react-date-range' {
  import { ComponentType } from 'react';

  export interface DateRangeType {
    startDate: Date | null;
    endDate: Date | null;
    key: string;
  }

  export interface DateRangeProps {
    ranges?: DateRangeType[];
    onChange?: (ranges: { [key: string]: DateRangeType }) => void;
    locale?: object;
    theme?: object;
    className?: string;
    style?: object;
    [key: string]: unknown;
  }

  // 핵심: DateRange 컴포넌트 선언
  export const DateRange: ComponentType<DateRangeProps>;
} 