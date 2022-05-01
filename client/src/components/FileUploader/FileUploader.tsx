import { Modal } from "@mantine/core";
import { Dispatch, SetStateAction } from "react";

import { useMantineTheme } from "@mantine/core";

import { FileDropZone } from "./FileDropzone";

interface FileUploaderProps {
    opened: boolean;
    callBackFn: Dispatch<SetStateAction<boolean>>;
}

function FileUploader(props: FileUploaderProps) {
    const theme = useMantineTheme();

    return (
        <Modal
            closeOnClickOutside={false}
            closeOnEscape={false}
            centered
            opened={props.opened}
            onClose={() => props.callBackFn(false)}>
            <FileDropZone />
        </Modal>
    );
}

export default FileUploader;
