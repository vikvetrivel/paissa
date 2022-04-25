import { createStyles, Badge, Grid } from "@mantine/core";
import { format, differenceInDays } from "date-fns";

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

    masterDiv: {
        width: "300px",
        maxWidth: "300px",
        overflow: "hidden",
        whiteSpace: "nowrap",
        fontFamily: `Greycliff CF, ${theme.fontFamily}`,
        lineHeight: 1,
        fontSize: "8px",
    },
}));

function LegQuickView(props) {
    const { classes } = useStyles();

    return props.leg.instrumentType.includes("Option") ? (
        <div className={classes.masterDiv}>
            <Grid align='center' gutter={0}>
                <Grid.Col span={2}>
                    <Badge
                        fullWidth
                        color='gray'
                        variant='filled'
                        size='md'
                        radius={0}
                        mb={2}>
                        {props.leg.direction == "Short"
                            ? -1 * props.leg.size
                            : props.leg.size}
                    </Badge>
                </Grid.Col>
                <Grid.Col span={3}>
                    <Badge fullWidth color='gray' size='md' radius={0}>
                        {format(new Date(props.leg.expiration), "MMM dd")}
                    </Badge>
                </Grid.Col>
                <Grid.Col span={2}>
                    <Badge
                        fullWidth
                        color='gray'
                        variant='filled'
                        size='md'
                        radius={0}>
                        {differenceInDays(
                            new Date(props.leg.expiration),
                            new Date()
                        ) < 0
                            ? "EXP"
                            : differenceInDays(
                                  new Date(props.leg.expiration),
                                  new Date()
                              )}{" "}
                    </Badge>
                </Grid.Col>
                <Grid.Col span={2}>
                    <Badge fullWidth color='gray' size='md' radius={0}>
                        {props.leg.strike}
                    </Badge>
                </Grid.Col>
                <Grid.Col span={1}>
                    <Badge color='gray' variant='filled' size='md' radius={0}>
                        {props.leg.optionsType.substring(0, 1)}
                    </Badge>
                </Grid.Col>
            </Grid>
        </div>
    ) : (
        <div className={classes.masterDiv}>
            {" "}
            <Grid align='center' gutter={0}>
                <Grid.Col span={2}>
                    <Badge
                        fullWidth
                        color='gray'
                        variant='filled'
                        size='md'
                        radius={0}
                        mb={2}>
                        {props.leg.direction == "Short"
                            ? -1 * props.leg.size
                            : props.leg.size}{" "}
                    </Badge>
                </Grid.Col>
                <Grid.Col span={3}>
                    <Badge fullWidth color='gray' size='md' radius={0}>
                        SHARES
                    </Badge>
                </Grid.Col>
            </Grid>
        </div>
    );
}

export default LegQuickView;
