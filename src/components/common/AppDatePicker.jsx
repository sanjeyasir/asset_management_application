import { Controller } from "react-hook-form";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

export function AppDatePicker({
    name,
    control,
    label,
    defaultValue = "",
    rules,
    ...props
}) {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Controller
                name={name}
                control={control}
                defaultValue={defaultValue}
                rules={rules}
                render={({ field: { onChange, value }, fieldState: { error } }) => {
                    const parsedValue = value ? dayjs(value) : null;
                    return (
                        <DatePicker
                            label={label}
                            value={parsedValue}
                            onChange={(date) => {
                                onChange(date && dayjs(date).isValid() ? dayjs(date).format("YYYY-MM-DD") : "");
                            }}
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    error: !!error,
                                    helperText: error ? error.message : "",
                                    ...props
                                }
                            }}
                        />
                    );
                }}
            />
        </LocalizationProvider>
    );
}

export default AppDatePicker;
