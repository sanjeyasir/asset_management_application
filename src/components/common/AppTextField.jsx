import { Controller } from "react-hook-form";
import { TextField } from "@mui/material";

export function AppTextField({
    name,
    control,
    label,
    defaultValue = "",
    rules,
    type = "text",
    ...props
}) {
    return (
        <Controller
            name={name}
            control={control}
            defaultValue={defaultValue}
            rules={rules}
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <TextField
                    label={label}
                    type={type}
                    value={value}
                    onChange={onChange}
                    inputRef={ref}
                    error={!!error}
                    helperText={error ? error.message : ""}
                    fullWidth
                    {...props}
                />
            )}
        />
    );
}

export default AppTextField;
