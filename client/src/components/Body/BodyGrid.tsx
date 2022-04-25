import { Container, Grid, Paper, useMantineTheme } from "@mantine/core";
import { StatsGrid } from "../Stats/StatsGrid";
import Portfolio from "../Portfolio/Portfolio";
import Trades from "../Trades/Trades";
import Spreads from "../Spreads/Spreads";

const testProps = {
    name: "vikram",
};

export function BodyGrid() {
    const theme = useMantineTheme();

    return (
        <Container fluid px={0} mx={0}>
            <StatsGrid
                data={[
                    {
                        title: "Net Liq.",
                        icon: "dollar",
                        value: "4,145",
                        diff: -13,
                    },
                    {
                        title: "Cash",
                        icon: "dollar",
                        value: "745",
                        diff: 18,
                    },
                    {
                        title: "Gross Return",
                        icon: "dollar",
                        value: "232,423",
                        diff: 34,
                    },
                    {
                        title: "Net Return",
                        icon: "dollar",
                        value: "4,145",
                        diff: -13,
                    },
                    {
                        title: "No. of Trades",
                        icon: "discount",
                        value: "745",
                        diff: 0,
                    },
                ]}
            />

            <Grid gutter='xs' columns={24}>
                {/* <Grid.Col span={4}>
                    <Paper px='xs' shadow='xs' key='portfolio'>
                        <Portfolio />
                    </Paper>
                </Grid.Col> */}

                <Grid.Col xs={18}>
                    <Paper px='xs' shadow='xs' key='trades'>
                        <Trades />
                    </Paper>
                </Grid.Col>

                <Grid.Col span={6}>
                    <Paper px='xs' shadow='xs' key='legFlow'>
                        <Spreads />
                    </Paper>
                </Grid.Col>
            </Grid>
        </Container>
    );
}
