import React from "react";
import { createStyles, Group, Paper, SimpleGrid, Text } from "@mantine/core";
import {
    UserPlus,
    Discount2,
    Receipt2,
    Coin,
    ArrowUpRight,
    ArrowDownRight,
    CurrencyDollar,
} from "tabler-icons-react";

const useStyles = createStyles((theme) => ({
    root: {
        padding: theme.spacing.xs,
    },

    value: {
        fontSize: 24,
        fontWeight: 400,
    },

    diff: {
        fontSize: 16,
        display: "flex",
        alignItems: "center",
    },

    icon: {
        color:
            theme.colorScheme === "dark"
                ? theme.colors.dark[3]
                : theme.colors.gray[4],
    },

    title: {
        fontWeight: 800,
        textTransform: "uppercase",
    },
}));

const icons = {
    user: UserPlus,
    discount: Discount2,
    receipt: Receipt2,
    coin: Coin,
    dollar: CurrencyDollar,
};

interface StatsGridProps {
    data: {
        title: string;
        icon: keyof typeof icons;
        value: string;
        diff: number;
    }[];
}

export function StatsGrid({ data }: StatsGridProps) {
    const { classes } = useStyles();
    const stats = data.map((stat) => {
        const Icon = icons[stat.icon];
        const DiffIcon = stat.diff > 0 ? ArrowUpRight : ArrowDownRight;

        return (
            <Paper p='xs' radius='md' key={stat.title} shadow='sm'>
                <Group position='apart'>
                    <Text size='xs' color='dimmed' className={classes.title}>
                        {stat.title}
                    </Text>
                    <Icon className={classes.icon} size={16} />
                </Group>

                <Group align='flex-end' spacing='xs' position='apart'>
                    <Text size='lg'>${stat.value}</Text>
                    <Text
                        color={stat.diff > 0 ? "teal" : "red"}
                        weight={300}
                        className={classes.diff}>
                        <span>{stat.diff}%</span>
                        <DiffIcon size={16} />
                    </Text>
                </Group>
            </Paper>
        );
    });
    return (
        <div className={classes.root}>
            <SimpleGrid
                cols={8}
                breakpoints={[
                    { maxWidth: "lg", cols: 8 },
                    { maxWidth: "md", cols: 4 },
                    { maxWidth: "sm", cols: 2 },
                    { maxWidth: "xs", cols: 0 },
                ]}>
                {stats}
            </SimpleGrid>
        </div>
    );
}
