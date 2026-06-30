// dayjs 中心化配置 —— 注册所需插件，统一从这里 import
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(isoWeek) // ISO 周（周一起始）
dayjs.extend(weekOfYear)
dayjs.extend(advancedFormat)
dayjs.extend(customParseFormat)

export { dayjs }
export type { Dayjs } from 'dayjs'
