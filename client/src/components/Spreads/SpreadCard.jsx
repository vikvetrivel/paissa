import { useCallback } from "react";
import { Handle, Position } from "react-flow-renderer";

import {
    Card,
    Text,
    Group,
    Badge,
    createStyles,
    RingProgress,
    Center,
} from "@mantine/core";
import { Cell, CalendarTime } from "tabler-icons-react";

const handleStyle = { left: 10 };

const useStyles = createStyles((theme) => ({
    card: {
        backgroundColor:
            theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.white,

        borderWidth: "5px",
    },

    imageSection: {
        padding: theme.spacing.md,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: `1px solid ${
            theme.colorScheme === "dark"
                ? theme.colors.dark[4]
                : theme.colors.gray[3]
        }`,
    },

    label: {
        fontSize: theme.fontSizes.sm,
        textTransform: "uppercase",
    },

    section: {
        padding: theme.spacing.md,
        borderTop: `1px solid ${
            theme.colorScheme === "dark"
                ? theme.colors.dark[4]
                : theme.colors.gray[3]
        }`,
    },

    icon: {
        marginRight: 5,
        color:
            theme.colorScheme === "dark"
                ? theme.colors.dark[2]
                : theme.colors.gray[5],
    },
    ring: {
        flex: 1,
        display: "flex",
        justifyContent: "flex-end",

        [theme.fn.smallerThan(350)]: {
            justifyContent: "center",
            marginTop: theme.spacing.md,
        },
    },
}));

const mockdata = [
    { label: "3 legs", icon: Cell },
    { label: "32 days", icon: CalendarTime },
];

export function SpreadCard({ data }) {
    console.log(data);
    const { classes } = useStyles();

    const onChange = useCallback((evt) => {
        console.log(evt.target.value);
    }, []);

    const completed = 32;
    const total = 100;

    return (
        <>
            <Handle type='target' position={Position.Top} />
            <Card shadow='sm' withBorder radius='md' className={classes.card}>
                <Group position='apart'>
                    <div>
                        <Text weight={600}>{data.spread.spreadType}</Text>
                        <Group spacing={8} mb={-8}>
                            <Center key={data.spread.legs.length}>
                                <Cell size={18} className={classes.icon} />
                                <Text size='xs'>
                                    {data.spread.legs.length} legs
                                </Text>
                            </Center>
                        </Group>
                    </div>
                    <Text
                        color={data.spread.totalNetReturn > 0 ? "green" : "red"}
                        size='xl'>
                        {data.spread.totalNetReturn.toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                        })}
                    </Text>
                </Group>
                <Card.Section className={classes.section} mt='md'>
                    <Group>
                        {data.spread.legs.map((leg) => {
                            return (
                                <RingProgress
                                    roundCaps
                                    thickness={2}
                                    size={60}
                                    sections={[
                                        {
                                            value: (completed / total) * 100,
                                            color: "green",
                                        },
                                    ]}
                                    label={
                                        <div>
                                            <Text
                                                align='center'
                                                className={classes.label}
                                                sx={{ fontSize: 14 }}>
                                                {leg.strike}
                                                {leg.optionsType.substring(
                                                    0,
                                                    1
                                                )}
                                            </Text>
                                        </div>
                                    }
                                />
                            );
                        })}
                    </Group>
                </Card.Section>
            </Card>
            <Handle type='source' position={Position.Bottom} id='a' />
        </>
    );
}
