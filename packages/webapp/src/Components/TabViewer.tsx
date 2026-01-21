import { useEffect, useRef } from "react";
import { AlphaTabApi, ExporterSettings, ImporterSettings, LayoutMode, NotationSettings, PlayerSettings, RenderingResources, Settings, StaveProfile, SystemsLayoutMode } from "@coderline/alphatab";
import "./TabViewer.css";

export interface TabViewerProps {
    file: File;
}

export function TabViewer(props: TabViewerProps) {
    const { file } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<AlphaTabApi | null>(null);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const settings: Settings = {
            core: {
                engine: "svg",
                logLevel: 1,
                fontDirectory: "/vendor/assets/fonts/",
                scriptFile: null,
                smuflFontSources: null,
                file: null,
                tex: false,
                tracks: null,
                enableLazyLoading: false,
                useWorkers: true,
                includeNoteBounds: false
            },
            display: {
                scale: 0.8,
                stretchForce: 0,
                layoutMode: LayoutMode.Page,
                staveProfile: StaveProfile.Default,
                barsPerRow: 0,
                startBar: 0,
                barCount: 0,
                barCountPerPartial: 0,
                justifyLastSystem: false,
                resources: new RenderingResources,
                padding: [],
                firstSystemPaddingTop: 0,
                systemPaddingTop: 0,
                systemPaddingBottom: 0,
                lastSystemPaddingBottom: 0,
                systemLabelPaddingLeft: 0,
                systemLabelPaddingRight: 0,
                accoladeBarPaddingRight: 0,
                notationStaffPaddingTop: 0,
                notationStaffPaddingBottom: 0,
                effectStaffPaddingTop: 0,
                effectStaffPaddingBottom: 0,
                firstStaffPaddingLeft: 0,
                staffPaddingLeft: 0,
                effectBandPaddingBottom: 0,
                systemsLayoutMode: SystemsLayoutMode.Automatic
            },
            notation: new NotationSettings,
            importer: new ImporterSettings,
            player: new PlayerSettings,
            exporter: new ExporterSettings,
            setSongBookModeSettings: function (): void {
                throw new Error("Function not implemented.");
            },
            fillFromJson: function (): void {
                throw new Error("Function not implemented.");
            }
        };

        // Initialize alphaTab
        const api = new AlphaTabApi(containerRef.current, settings);
        apiRef.current = api;

        // Load the file
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                api.load(e.target.result as ArrayBuffer);
            }
        };
        reader.readAsArrayBuffer(file);

        // Cleanup
        return () => {
            api.destroy();
        };
    }, [file]);

    return (
        <div className="tab-viewer">
            <div ref={containerRef} className="tab-container" />
        </div>
    );
}

export default TabViewer;
