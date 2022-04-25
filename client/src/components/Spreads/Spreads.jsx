import {
    Title,
    createStyles,
    Timeline,
    ScrollArea,
    Badge,
    Paper,
    Text,
    Group,
    Grid,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { useViewportSize } from "@mantine/hooks";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { SpreadSummary } from "./SpreadSummary";
import LegQuickView from "../Legs/LegQuickView";

const useStyles = createStyles((theme, { height, width }) => ({
    title: {
        fontSize: 18,
        color:
            theme.colorScheme === "dark"
                ? theme.colors.dark[3]
                : theme.colors.gray[4],
        textTransform: "uppercase",
    },

    bodyFonts: {
        fontSize: 12,
        color:
            theme.colorScheme === "dark"
                ? theme.colors.dark[1]
                : theme.colors.gray[4],
        marginBottom: 5,
        marginTop: 2,
    },

    moneyFont: {
        fontSize: 14,
        textTransform: "uppercase",
    },
    container: {
        width: (width / 24) * 4 + 60,
        height: height - 225,
    },
}));

export default function Spreads() {
    const { height, width } = useViewportSize();
    const { classes } = useStyles({ height, width });
    const [spreadData, setSpreadData] = useState(null);
    const selectedTrade = useSelector((state) => state.trades.selectedTrade);
    const allTrades = useSelector((state) => state.trades.trades);

    useEffect(() => {
        getSpreadData();
    }, [selectedTrade, allTrades]);

    const getSpreadData = () => {
        if (selectedTrade) {
            const data = allTrades.filter((t) => t._id == selectedTrade);
            setSpreadData(data[0]);
        }
    };

    if (spreadData) {
        return (
            <div>
                <Title order={4} className={classes.title} py='xs'>
                    Spreads
                </Title>
                <ScrollArea scrollbarSize={2} sx={{ height: height - 215 }}>
                    <SpreadSummary spread={spreadData} />
                    <Timeline active={100} bulletSize={24} lineWidth={2}>
                        {spreadData.spreads.map((s, index) => {
                            let entryText =
                                s.howOpened == "New"
                                    ? "New spread"
                                    : "Rolled In";

                            let exitText = s.howClosed;
                            let titleText = `${entryText} - ${exitText}`;

                            let openLegs = [];

                            s.legs.map((l) => {
                                openLegs.push(l);
                            });

                            openLegs.sort((a, b) =>
                                a.strike < b.strike ? -1 : 1
                            );

                            return (
                                <Timeline.Item
                                    color={s.netReturn < 0 ? "red" : "teal"}
                                    title={titleText}>
                                    {" "}
                                    <Paper shadow='xl' p='md' withBorder>
                                        <Badge
                                            color='grape'
                                            variant='outline'
                                            radius='sm'
                                            px='xs'>
                                            {s.spreadType}
                                        </Badge>{" "}
                                        <Badge
                                            color={
                                                s.status == "Win"
                                                    ? "teal"
                                                    : s.status == "Open"
                                                    ? "yellow"
                                                    : "red"
                                            }
                                            variant='filled'
                                            radius='sm'
                                            px='xs'>
                                            {s.status}
                                        </Badge>{" "}
                                        <Text className={classes.bodyFonts}>
                                            {`${format(
                                                new Date(s.openDate),
                                                "MMM d, yyyy"
                                            )}`}{" "}
                                            -{" "}
                                            {s.closeDate
                                                ? `${format(
                                                      new Date(s.closeDate),
                                                      "MMM d, yyyy"
                                                  )}`
                                                : "Still Open"}
                                        </Text>
                                        {openLegs.map((l) => {
                                            return (
                                                <Grid gutter={0}>
                                                    <Grid.Col span={8}>
                                                        <LegQuickView
                                                            leg={
                                                                l
                                                            }></LegQuickView>
                                                    </Grid.Col>
                                                    <Grid.Col span={4}>
                                                        <Text>
                                                            {" "}
                                                            <Text
                                                                className={
                                                                    classes.bodyFonts
                                                                }>
                                                                {`${format(
                                                                    new Date(
                                                                        l.openDate
                                                                    ),
                                                                    "MMM d"
                                                                )}`}{" "}
                                                                -{" "}
                                                                {l.closeDate
                                                                    ? `${format(
                                                                          new Date(
                                                                              l.closeDate
                                                                          ),
                                                                          "MMM d"
                                                                      )}`
                                                                    : "Still Open"}
                                                            </Text>
                                                        </Text>
                                                    </Grid.Col>
                                                </Grid>
                                            );
                                        })}
                                        <Group spacing='md'>
                                            <div key='entryCost'>
                                                <Text size='xs' color='dimmed'>
                                                    Entry Cost
                                                </Text>
                                                <Text weight={500} size='sm'>
                                                    {(
                                                        -1 * s.entryCost
                                                    ).toLocaleString("en-US", {
                                                        style: "currency",
                                                        currency: "USD",
                                                    })}
                                                </Text>
                                            </div>
                                            {s.netReturn &&
                                            s.entryCost &&
                                            s.status != "Open" ? (
                                                <div key='exitCost'>
                                                    <Text
                                                        size='xs'
                                                        color='dimmed'>
                                                        Exit Cost
                                                    </Text>
                                                    <Text
                                                        weight={500}
                                                        size='sm'>
                                                        {(
                                                            -1 *
                                                            (s.entryCost -
                                                                s.netReturn)
                                                        ).toLocaleString(
                                                            "en-US",
                                                            {
                                                                style: "currency",
                                                                currency: "USD",
                                                            }
                                                        )}
                                                    </Text>
                                                </div>
                                            ) : (
                                                ""
                                            )}
                                            {s.netLiq && s.status == "Open" ? (
                                                <div key='netLiq'>
                                                    <Text
                                                        size='xs'
                                                        color='dimmed'>
                                                        Net Liq
                                                    </Text>
                                                    <Text
                                                        weight={500}
                                                        size='sm'>
                                                        {s?.netLiq?.toLocaleString(
                                                            "en-US",
                                                            {
                                                                style: "currency",
                                                                currency: "USD",
                                                            }
                                                        )}
                                                    </Text>
                                                </div>
                                            ) : (
                                                ""
                                            )}
                                            {s.netReturn &&
                                            s.status == "Closed" ? (
                                                <div key='netReturn'>
                                                    <Text
                                                        size='xs'
                                                        color='dimmed'>
                                                        Net Return
                                                    </Text>
                                                    <Text
                                                        weight={500}
                                                        size='sm'
                                                        color={
                                                            s.netReturn > 0
                                                                ? "teal"
                                                                : "red"
                                                        }>
                                                        {s?.netReturn?.toLocaleString(
                                                            "en-US",
                                                            {
                                                                style: "currency",
                                                                currency: "USD",
                                                            }
                                                        )}
                                                    </Text>
                                                </div>
                                            ) : (
                                                ""
                                            )}
                                            {s.netReturn &&
                                            s.netLiq &&
                                            s.status == "Open" ? (
                                                <div key='opProfit'>
                                                    <Text
                                                        size='xs'
                                                        color='dimmed'>
                                                        Op Profit
                                                    </Text>
                                                    <Text
                                                        weight={500}
                                                        size='sm'
                                                        color={
                                                            s.netLiq +
                                                                s.netReturn >
                                                            0
                                                                ? "teal"
                                                                : "red"
                                                        }>
                                                        {(
                                                            s.netLiq +
                                                            s.netReturn
                                                        ).toLocaleString(
                                                            "en-US",
                                                            {
                                                                style: "currency",
                                                                currency: "USD",
                                                            }
                                                        )}
                                                    </Text>
                                                </div>
                                            ) : (
                                                ""
                                            )}
                                        </Group>
                                    </Paper>
                                </Timeline.Item>
                            );
                        })}
                    </Timeline>
                </ScrollArea>
            </div>
        );
    } else
        return (
            <div>
                <Title order={4} className={classes.title} py='xs'>
                    Spreads
                </Title>
                <ScrollArea scrollbarSize={2} sx={{ height: height - 225 }} />
            </div>
        );
}
