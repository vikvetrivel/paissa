import { createStyles, Card, Text, Group, Space, Badge } from "@mantine/core";

import LegQuickView from "../Legs/LegQuickView";

const useStyles = createStyles((theme) => ({
    card: {
        backgroundColor:
            theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
    },

    footer: {
        display: "flex",
        justifyContent: "space-between",
        padding: `${theme.spacing.sm}px ${theme.spacing.lg}px`,
        borderTop: `1px solid ${
            theme.colorScheme === "dark"
                ? theme.colors.dark[5]
                : theme.colors.gray[2]
        }`,
    },

    title: {
        fontFamily: `Greycliff CF, ${theme.fontFamily}`,
        lineHeight: 1,
    },
}));

export function SpreadSummary(props) {
    const { classes } = useStyles();

    let openLegs = [];

    props.spread.spreads.map((s) => {
        s.legs.map((l) => {
            if (l.status == "Open") openLegs.push(l);
        });
    });

    openLegs.sort((a, b) => (a.strike < b.strike ? -1 : 1));

    return (
        <Card withBorder p='lg' className={classes.card} mb='xl' shadow='xl'>
            <Group position='apart'>
                <Text size='xl' weight={700} className={classes.title}>
                    {props.spread.underlying}
                </Text>
                <Group spacing={5}>
                    <Badge
                        color={
                            props.spread.status == "Win"
                                ? "teal"
                                : props.spread.status == "Open"
                                ? "yellow"
                                : "red"
                        }
                        variant='filled'
                        radius='sm'
                        px='xs'>
                        {props.spread.status}
                    </Badge>
                </Group>
            </Group>

            {props.spread.status == "Open" ? (
                <div>
                    <Text
                        mt='sm'
                        mb='md'
                        color='dimmed'
                        size='xs'
                        className={classes.title}>
                        OPEN POSITIONS
                    </Text>

                    {openLegs.map((l) => {
                        return <LegQuickView leg={l}></LegQuickView>;
                    })}
                </div>
            ) : (
                ""
            )}
            <Space h='xl' />
            <Card.Section className={classes.footer}>
                <Group spacing='md'>
                    <div key='entryCost'>
                        <Text size='xs' color='dimmed'>
                            Entry Cost
                        </Text>
                        <Text weight={500} size='sm'>
                            {(-1 * props.spread.entryCost).toLocaleString(
                                "en-US",
                                {
                                    style: "currency",
                                    currency: "USD",
                                }
                            )}
                        </Text>
                    </div>
                    {props.spread.netReturn &&
                    props.spread.entryCost &&
                    props.spread.status != "Open" ? (
                        <div key='exitCost'>
                            <Text size='xs' color='dimmed'>
                                Exit Cost
                            </Text>
                            <Text weight={500} size='sm'>
                                {(
                                    -1 *
                                    (props.spread.entryCost -
                                        props.spread.netReturn)
                                ).toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                })}
                            </Text>
                        </div>
                    ) : (
                        ""
                    )}
                    {props.spread.entryCost &&
                    props.spread.netReturn &&
                    props.spread.status == "Closed" ? (
                        <div key='netReturn'>
                            <Text size='xs' color='dimmed'>
                                Net Return
                            </Text>
                            <Text weight={500} size='sm'>
                                {(
                                    props.spread.netReturn -
                                    props.spread.entryCost
                                ).toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                })}
                            </Text>
                        </div>
                    ) : (
                        ""
                    )}
                    {props.spread.netLiq && props.spread.status == "Open" ? (
                        <div key='netLiq'>
                            <Text size='xs' color='dimmed'>
                                Net Liq
                            </Text>
                            <Text weight={500} size='sm'>
                                {props.spread?.netLiq?.toLocaleString("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                })}
                            </Text>
                        </div>
                    ) : (
                        ""
                    )}
                </Group>
            </Card.Section>
        </Card>
    );
}
