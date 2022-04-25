import { createStyles, Header, Group, Burger, Button } from "@mantine/core";

import { useBooleanToggle } from "@mantine/hooks";

const useStyles = createStyles((theme) => ({
    header: {
        paddingLeft: theme.spacing.xs,
        paddingRight: theme.spacing.xs,
    },

    inner: {
        height: 45,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },

    link: {
        display: "block",
        lineHeight: 1,
        padding: "8px 12px",
        borderRadius: theme.radius.sm,
        textDecoration: "none",
        color:
            theme.colorScheme === "dark"
                ? theme.colors.dark[0]
                : theme.colors.gray[7],
        fontSize: theme.fontSizes.sm,
        fontWeight: 500,

        "&:hover": {
            backgroundColor:
                theme.colorScheme === "dark"
                    ? theme.colors.dark[6]
                    : theme.colors.gray[0],
        },
    },
}));

export function PaissaHeader() {
    const [opened, toggleOpened] = useBooleanToggle(false);
    const { classes } = useStyles();

    return (
        <Header height={45} className={classes.header} mb={120}>
            <div className={classes.inner}>
                <Group>
                    <Burger
                        opened={opened}
                        onClick={() => toggleOpened()}
                        size='xs'
                    />
                </Group>

                <Group>
                    <Button
                        color='yellow'
                        radius='md'
                        size='xs'
                        variant='outline'>
                        New Portfolio
                    </Button>
                    <Button color='yellow' radius='md' size='xs'>
                        Add Trades
                    </Button>
                </Group>
            </div>
        </Header>
    );
}
