import { useState } from "react";
import { Avatar, Table, Text, createStyles, ScrollArea } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";

const useStyles = createStyles((theme) => ({
    symbol: {
        fontSize: 14,
    },
    tableFonts: {
        fontSize: 12,
        textTransform: "uppercase",
        fontWeight: 300,
    },

    header: {
        position: "sticky",
        top: 0,
        backgroundColor:
            theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
        transition: "box-shadow 150ms ease",

        "&::after": {
            content: '""',
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            borderBottom: `1px solid ${
                theme.colorScheme === "dark"
                    ? theme.colors.dark[3]
                    : theme.colors.gray[2]
            }`,
        },
    },

    scrolled: {
        boxShadow: theme.shadows.sm,
    },

    other: {
        fontSize: 14,
    },
}));

interface PortfolioTableProps {
    data: {
        symbol: string;
        strike: number;
        expiration: Date;
        instrumentType: string;
        optionsType: string;
        underlying: string;
        size: number;
        direction: string;
        cost: number;
        price: number;
        commission: number;
        name: string;
        logo: string;
    }[];
}

export function PortfolioTable({ data }: PortfolioTableProps) {
    const { classes, cx } = useStyles();
    const [scrolled, setScrolled] = useState(false);
    const { height } = useViewportSize();

    const rows = data.map((item) => {
        var diffInDays = 0;
        if (item.expiration) {
            let currentDate = new Date().getTime();
            let expiryDate = new Date(item.expiration).getTime();
            diffInDays = Math.ceil(
                (expiryDate - currentDate) / (1000 * 3600 * 24)
            );
        }

        return (
            <tr key={item.symbol}>
                <td>
                    <Avatar size={20} src={item.logo}>
                        {item.underlying.substring(0, 3)}
                    </Avatar>
                </td>
                <td>
                    <Text className={classes.symbol}>{item.underlying}</Text>
                </td>

                <td>
                    <Text
                        align='right'
                        className={classes.other}
                        color={item.cost > 0 ? "teal" : "red"}>
                        {item.cost.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                        })}
                    </Text>
                </td>
            </tr>
        );
    });

    return (
        <ScrollArea
            scrollbarSize={2}
            sx={{ height: height - 225 }}
            onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
            <Table highlightOnHover>
                <thead
                    className={cx(classes.header, {
                        [classes.scrolled]: scrolled,
                    })}>
                    <th></th>
                    <th>
                        <Text className={classes.tableFonts} align='left'>
                            Symbol
                        </Text>
                    </th>

                    <th>
                        <Text className={classes.tableFonts} align='right'>
                            Value (USD)
                        </Text>
                    </th>
                </thead>
                <tbody>{rows}</tbody>
            </Table>
        </ScrollArea>
    );
}
