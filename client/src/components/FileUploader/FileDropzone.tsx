import {
    Group,
    Text,
    useMantineTheme,
    Stack,
    Button,
    MantineTheme,
    Loader,
    Select,
    createStyles,
} from "@mantine/core";
import { CloudUpload } from "tabler-icons-react";
import { Dropzone, DropzoneStatus, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { useState, useEffect } from "react";

import axios from "axios";
import { useBooleanToggle } from "@mantine/hooks";

interface PortfolioMeta {
    _id: string;
    broker: string;
    label: string;
}

const useStyles = createStyles((theme) => ({
    wrapper: {
        position: "relative",
        marginBottom: 30,
    },

    dropzone: {
        borderWidth: 1,
        paddingBottom: 50,
    },

    icon: {
        color:
            theme.colorScheme === "dark"
                ? theme.colors.dark[3]
                : theme.colors.gray[4],
    },

    control: {
        position: "absolute",
        width: 250,
        left: "calc(50% - 125px)",
        bottom: -20,
    },
}));

function getActiveColor(status: DropzoneStatus, theme: MantineTheme) {
    return status.accepted
        ? theme.colors[theme.primaryColor][6]
        : status.rejected
        ? theme.colors.red[6]
        : theme.colorScheme === "dark"
        ? theme.colors.dark[0]
        : theme.black;
}

export function FileDropZone() {
    const theme = useMantineTheme();
    const [files, setFiles] = useState<File[]>([]);
    const [portfolios, setPortfolios] = useState([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState<string>();

    const [uploadInProgress, setUploadInProgress] = useBooleanToggle(false);

    useEffect(() => {
        // get the available portfolios for this user.

        const getPorfolioMeta = async () => {
            let p = await axios.get("http://localhost:8000/api/portfolio/meta");
            p.data.map((d: any) => (d.label = d.broker));
            setPortfolios(p.data);
            setSelectedPortfolio(p.data[0]._id);
        };

        getPorfolioMeta();
    }, []);

    const uploadFiles = () => {
        setUploadInProgress(true);
    };

    return (
        <Stack align='center' justify='space-around'>
            {uploadInProgress == false ? (
                <>
                    <Select
                        label='Portfolio'
                        placeholder='Pick one'
                        data={portfolios}
                        onChange={(values) => console.log(values)}
                    />

                    <Dropzone
                        onDrop={(files) => setFiles(files)}
                        onReject={(files) =>
                            console.log("rejected files", files)
                        }
                        maxSize={3 * 1024 ** 2}
                        accept={["text/csv"]}>
                        {(status) => (
                            <div style={{ pointerEvents: "none" }}>
                                <Group position='center'>
                                    <CloudUpload
                                        size={50}
                                        color={getActiveColor(status, theme)}
                                    />
                                </Group>
                                <Text
                                    align='center'
                                    weight={700}
                                    size='lg'
                                    mt='xl'
                                    sx={{
                                        color: getActiveColor(status, theme),
                                    }}>
                                    {status.accepted
                                        ? "Drop files here"
                                        : status.rejected
                                        ? "Pdf file less than 30mb"
                                        : "Upload Trades CSV"}
                                </Text>
                                <Text
                                    align='center'
                                    size='sm'
                                    mt='xs'
                                    color='dimmed'>
                                    Drag&apos;n&apos;drop files here to upload.
                                    We can accept only <i>.csv</i> files that
                                    are less than 30mb in size.
                                </Text>
                            </div>
                        )}
                    </Dropzone>
                </>
            ) : (
                <Loader color='orange' variant='bars' />
            )}
            <Button
                onClick={() => uploadFiles()}
                color='orange'
                disabled={files.length > 0 ? false : true}>
                Upload Files
            </Button>
        </Stack>
    );
}
