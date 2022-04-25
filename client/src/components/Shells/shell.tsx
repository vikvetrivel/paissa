import { AppShell, useMantineTheme } from "@mantine/core";

import { BodyGrid } from "../Body/BodyGrid";
import { PaissaHeader } from "../Header/PaissaHeader";

export default function Shell() {
    const theme = useMantineTheme();

    return (
        <AppShell
            styles={{
                main: {
                    background:
                        theme.colorScheme === "dark"
                            ? theme.colors.dark[8]
                            : theme.colors.gray[0],
                    margin: 0,
                },
            }}
            navbarOffsetBreakpoint='sm'
            asideOffsetBreakpoint='sm'
            fixed
            header={<PaissaHeader></PaissaHeader>}>
            <BodyGrid />
        </AppShell>
    );
}
