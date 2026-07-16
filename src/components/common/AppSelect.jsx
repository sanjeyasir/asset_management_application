import { Controller } from "react-hook-form";
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from "@mui/material";

export function AppSelect({
    name,
    control,
    label,
    options = [], // Array of { value, label }
    defaultValue = "",
    rules,
    ...props
}) {
    const labelId = `${name}-select-label`;

    return (
        <Controller
            name={name}
            control={control}
            defaultValue={defaultValue}
            rules={rules}
            render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                <FormControl fullWidth error={!!error} {...props}>
                    <InputLabel id={labelId}>{label}</InputLabel>
                    <Select
                        labelId={labelId}
                        label={label}
                        value={value}
                        onChange={onChange}
                        inputRef={ref}
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
                        {options.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                    {error && <FormHelperText>{error.message}</FormHelperText>}
                </FormControl>
            )}
        />
    );
}

export default AppSelect;
