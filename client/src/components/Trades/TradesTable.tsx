import { useState } from "react";
import { useViewportSize } from "@mantine/hooks";
import {
    Checkbox,
    createStyles,
    ScrollArea,
    Text,
    Table,
    Badge,
} from "@mantine/core";
import { useDispatch } from "react-redux";
import { setSelectedTrade } from "./TradesSlice";
import { format } from "date-fns";

const useStyles = createStyles((theme) => ({
    rowSelected: {
        backgroundColor:
            theme.colorScheme === "dark"
                ? theme.fn.rgba(theme.colors[theme.primaryColor][7], 0.2)
                : theme.colors[theme.primaryColor][0],
    },

    tableFonts: {
        fontSize: 12,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        fontWeight: 300,
    },

    tableBodyFonts: {
        fontSize: 12,
        whiteSpace: "nowrap",
    },
    tableBodyExtraSmallFonts: {
        fontSize: 11,
        whiteSpace: "nowrap",
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
}));
interface TradesTableProps {
    data: {
        _id: string;
        portfolio: string;
        earliestExpiration: Date;
        instrumentTypes: [string];
        underlying: string;
        status: string;
        side: string;
        openDate: Date;
        closeDate: Date;
        strikes: [number];
        entryCost: number;
        target: number;
        netReturn: number;
        spreadCount: number;
        openingSpreadType: string;
        netLiq: number;
    }[];
}

export function TradesTable({ data }: TradesTableProps) {
    const { classes, cx } = useStyles();
    const [selection, setSelection] = useState(["1"]);
    const [scrolled, setScrolled] = useState(false);
    const { height } = useViewportSize();

    const dispatch = useDispatch();

    const toggleRow = (id: string) => {
        setSelection((current) =>
            current.includes(id)
                ? current.filter((item) => item !== id)
                : [...current, id]
        );
    };

    const currentSelection = (id: string) => {
        dispatch(setSelectedTrade(id));
    };
    const toggleAll = () =>
        setSelection((current) =>
            current.length === data.length ? [] : data.map((item) => item._id)
        );

    const rows = data.map((item) => {
        const selected = selection.includes(item._id);

        return (
            <tr
                key={item._id}
                className={cx({ [classes.rowSelected]: selected })}
                onClick={() => currentSelection(item._id)}>
                <td>
                    <Checkbox
                        checked={selection.includes(item._id)}
                        onChange={() => toggleRow(item._id)}
                        transitionDuration={0}
                    />
                </td>
                <td>
                    <Text
                        className={classes.tableBodyExtraSmallFonts}
                        align='left'>
                        {item.earliestExpiration &&
                        item.status == "Open" &&
                        new Date(item.earliestExpiration) > new Date() ? (
                            <Badge color='grape' radius='sm' p={3} m={2}>
                                {Math.floor(
                                    (new Date(
                                        item.earliestExpiration
                                    ).getTime() -
                                        new Date().getTime()) /
                                        86400000
                                )}
                                d
                            </Badge>
                        ) : (
                            ""
                        )}
                        {item.instrumentTypes.map((it) => {
                            return (
                                <Badge
                                    color='gray'
                                    size='xs'
                                    mx={1}
                                    variant='outline'
                                    key={it}>
                                    {it
                                        .split(" ")
                                        .map((word) => word[0])
                                        .join("")}
                                </Badge>
                            );
                        })}
                    </Text>
                </td>
                {/* Underlying */}
                <td>
                    <Text size='sm' color='white'>
                        {item.underlying}
                    </Text>
                </td>

                {/* Status */}
                <td>
                    <Text className={classes.tableFonts} align='left'>
                        <Badge
                            color={
                                item.status == "Win"
                                    ? "teal"
                                    : item.status == "Open"
                                    ? "yellow"
                                    : "red"
                            }
                            variant='filled'
                            radius='sm'
                            px='xs'>
                            {item.status}
                        </Badge>
                    </Text>
                </td>
                {/* Side */}
                <td>
                    <Text className={classes.tableFonts} align='left'>
                        <Badge
                            color={item.side == "Long" ? "teal" : "red"}
                            variant='outline'
                            radius='sm'
                            px='xs'>
                            {item.side}
                        </Badge>
                    </Text>
                </td>
                {/* Spread Type*/}
                <td>
                    <Text
                        className={classes.tableBodyExtraSmallFonts}
                        align='left'>
                        <Badge
                            color='grape'
                            variant='outline'
                            radius='sm'
                            px='xs'>
                            {item.openingSpreadType}
                        </Badge>
                    </Text>
                </td>
                {/* Spread Count */}
                <td>
                    <Text className={classes.tableFonts} align='center'>
                        {item.spreadCount}
                    </Text>
                </td>
                {/* Open Date */}
                <td>
                    {item.openDate ? (
                        <Text align='left' className={classes.tableBodyFonts}>
                            {format(new Date(item.openDate), "MMM d, yyyy")}
                        </Text>
                    ) : (
                        ""
                    )}
                </td>
                {/* Close Date */}
                <td>
                    {item.closeDate ? (
                        <Text align='left' className={classes.tableBodyFonts}>
                            {format(new Date(item.closeDate), "MMM d, yyyy")}
                        </Text>
                    ) : (
                        ""
                    )}
                </td>
                {/* Strikes */}
                <td>
                    {item.strikes ? (
                        <Text className={classes.tableBodyFonts} align='left'>
                            {item.strikes
                                .filter((a) => a)
                                .sort()
                                .join(", ").length > 20
                                ? item.strikes
                                      .filter((a) => a)
                                      .sort()
                                      .join(", ")
                                      .slice(0, 20)
                                      .concat("...")
                                : item.strikes
                                      .filter((a) => a)
                                      .sort()
                                      .join(", ")}
                        </Text>
                    ) : (
                        ""
                    )}
                </td>
                {/* Entry */}
                <td>
                    {item.entryCost ? (
                        <Text className={classes.tableBodyFonts} align='right'>
                            {(-1 * item.entryCost).toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                            })}
                        </Text>
                    ) : (
                        ""
                    )}
                </td>
                {/* Credits */}
                <td>
                    {item.entryCost &&
                    item.netReturn &&
                    item.status == "Open" ? (
                        <Text className={classes.tableBodyFonts} align='right'>
                            {(item.netReturn - item.entryCost).toLocaleString(
                                "en-US",
                                {
                                    style: "currency",
                                    currency: "USD",
                                }
                            )}
                        </Text>
                    ) : (
                        ""
                    )}
                </td>
                {/* Cost Basis */}
                <td>
                    {item.netReturn && item.status == "Open" ? (
                        <Text className={classes.tableBodyFonts} align='right'>
                            {(-1 * item.netReturn).toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                            })}
                        </Text>
                    ) : (
                        ""
                    )}
                </td>
                {/* Net Liq */}
                <td>
                    {item.netLiq && item.status == "Open" ? (
                        <Text className={classes.tableBodyFonts} align='right'>
                            {item.netLiq.toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                            })}
                        </Text>
                    ) : (
                        ""
                    )}
                </td>
                {/* Op Profit */}
                <td>
                    {item.netLiq && item.netReturn && item.status == "Open" ? (
                        <Text
                            color={
                                item.netLiq + item.netReturn > 0
                                    ? "teal"
                                    : "red"
                            }
                            className={classes.tableBodyFonts}
                            align='right'>
                            {(item.netLiq + item.netReturn).toLocaleString(
                                "en-US",
                                {
                                    style: "currency",
                                    currency: "USD",
                                }
                            )}
                        </Text>
                    ) : (
                        ""
                    )}
                    {item.netLiq && item.netReturn && item.status == "Open" ? (
                        <Text
                            color={
                                item.netLiq + item.netReturn > 0
                                    ? "teal"
                                    : "red"
                            }
                            className={classes.tableBodyFonts}
                            align='right'>
                            {(
                                (item.netLiq + item.netReturn) /
                                Math.abs(item.entryCost)
                            ).toLocaleString(undefined, {
                                style: "percent",
                                minimumFractionDigits: 2,
                            })}
                        </Text>
                    ) : (
                        ""
                    )}
                </td>

                {/* ExitCost */}
                <td>
                    {item.netReturn &&
                    item.entryCost &&
                    item.status != "Open" ? (
                        <Text className={classes.tableBodyFonts} align='right'>
                            {(
                                -1 * item.entryCost +
                                item.netReturn
                            ).toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                            })}
                        </Text>
                    ) : (
                        ""
                    )}
                </td>
                {/* Net Return */}
                <td>
                    {item.netReturn && item.status != "Open" ? (
                        <Text
                            color={item.netReturn > 0 ? "teal" : "red"}
                            className={classes.tableBodyFonts}
                            align='right'>
                            {item.netReturn.toLocaleString("en-US", {
                                style: "currency",
                                currency: "USD",
                            })}
                        </Text>
                    ) : (
                        ""
                    )}
                    {item.netReturn && item.status != "Open" ? (
                        <Text
                            color={item.netReturn > 0 ? "teal" : "red"}
                            className={classes.tableBodyFonts}
                            align='right'>
                            {(
                                item.netReturn / Math.abs(item.entryCost)
                            ).toLocaleString(undefined, {
                                style: "percent",
                                minimumFractionDigits: 2,
                            })}
                        </Text>
                    ) : (
                        ""
                    )}
                </td>
                {/* Hold Time */}
                <td>
                    {item.closeDate ? (
                        <Text align='center' className={classes.tableBodyFonts}>
                            {Math.floor(
                                (new Date(item.closeDate).getTime() -
                                    new Date(item.openDate).getTime()) /
                                    86400000
                            )}
                            d
                        </Text>
                    ) : (
                        <Text align='center' className={classes.tableBodyFonts}>
                            {Math.floor(
                                (new Date().getTime() -
                                    new Date(item.openDate).getTime()) /
                                    86400000
                            )}
                            d
                        </Text>
                    )}
                </td>
            </tr>
        );
    });

    return (
        <ScrollArea
            scrollbarSize={2}
            sx={{ height: height - 225 }}
            onScrollPositionChange={({ y }) => setScrolled(y !== 0)}>
            <Table fontSize='lg' highlightOnHover sx={{ minWidth: 700 }}>
                <thead
                    className={cx(classes.header, {
                        [classes.scrolled]: scrolled,
                    })}>
                    <tr key='headerRow'>
                        <th style={{ width: 40 }}>
                            <Checkbox
                                onChange={toggleAll}
                                checked={selection.length === data.length}
                                indeterminate={
                                    selection.length > 0 &&
                                    selection.length !== data.length
                                }
                                transitionDuration={0}
                            />
                        </th>
                        <th>
                            <Text className={classes.tableFonts} align='left'>
                                Indicators
                            </Text>
                        </th>
                        <th>
                            <Text className={classes.tableFonts} align='left'>
                                Symbol
                            </Text>
                        </th>

                        <th>
                            <Text className={classes.tableFonts} align='center'>
                                Status
                            </Text>
                        </th>
                        <th>
                            <Text className={classes.tableFonts} align='center'>
                                Side
                            </Text>
                        </th>
                        <th>
                            <Text className={classes.tableFonts} align='left'>
                                Opening Spread
                            </Text>
                        </th>
                        <th>
                            <Text className={classes.tableFonts} align='center'>
                                # Spread
                            </Text>
                        </th>
                        <th>
                            <Text className={classes.tableFonts} align='left'>
                                Open Date
                            </Text>
                        </th>
                        <th>
                            <Text className={classes.tableFonts} align='left'>
                                Close Date
                            </Text>
                        </th>
                        <th>
                            <Text className={classes.tableFonts} align='left'>
                                Strikes
                            </Text>
                        </th>
                        <th>
                            <Text className={classes.tableFonts} align='right'>
                                Entry Price
                            </Text>
                        </th>
                        <th>
                            <Text className={classes.tableFonts} align='right'>
                                Credits
                            </Text>
                        </th>
                        <th>
                            <Text className={classes.tableFonts} align='right'>
                                Cost Basis
                            </Text>
                        </th>

                        <th>
                            <Text className={classes.tableFonts} align='right'>
                                Net Liq.
                            </Text>
                        </th>
                        <th>
                            <Text className={classes.tableFonts} align='right'>
                                Op. Profit
                            </Text>
                        </th>

                        <th>
                            <Text className={classes.tableFonts} align='right'>
                                Exit Price
                            </Text>
                        </th>
                        <th>
                            <Text className={classes.tableFonts} align='right'>
                                Net Profit
                            </Text>
                        </th>

                        <th>
                            <Text className={classes.tableFonts} align='center'>
                                Hold Time
                            </Text>
                        </th>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </Table>
        </ScrollArea>
    );
}
