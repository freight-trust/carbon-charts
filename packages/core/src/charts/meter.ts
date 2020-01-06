// Internal Imports
import { ChartModel } from "../model";
import { Chart } from "../chart";
import * as Configuration from "../configuration";
import {
	ChartConfig,
	MeterChartOptions,
	LayoutGrowth,
	LayoutDirection
} from "../interfaces/index";
import { Tools } from "../tools";
import { Meter } from "./../components/graphs/meter";

// Components
import {
	Pie,
	// the imports below are needed because of typescript bug (error TS4029)
	Tooltip,
	Legend,
	LayoutComponent,
	TitleMeter,
	Spacer
} from "../components/index";

export class MeterChart extends Chart {
	model = new ChartModel(this.services);

	// TODO - Optimize the use of "extending"
	constructor(holder: Element, chartConfigs: ChartConfig<MeterChartOptions>, extending = false) {
		super(holder, chartConfigs);

		// TODO - Optimize the use of "extending"
		if (extending) {
			return;
		}

		// Merge the default options for this chart
		// With the user provided options
		this.model.setOptions(
			Tools.merge(
				Tools.clone(Configuration.options.meterChart),
				chartConfigs.options
			)
		);

		// Initialize data, services, components etc.
		this.init(holder, chartConfigs);
	}

	getComponents() {
		// Specify what to render inside the graph only
		const graph = {
			id: "meter-graph",
			components: [
				new Meter(this.model, this.services)
			],
			growth: {
				x: LayoutGrowth.STRETCH,
				y: LayoutGrowth.FIXED
			}
		};

		// Meter has an unique dataset title within the graph
		const titleComponent = {
			id: "title",
			components: [
				new TitleMeter(this.model, this.services)
			],
			growth: {
				x: LayoutGrowth.PREFERRED,
				y: LayoutGrowth.FIXED
			}
		};

		// create the title spacer
		const titleSpacerComponent = {
			id: "spacer",
			components: [
				new Spacer(this.model, this.services)
			],
			growth: {
				x: LayoutGrowth.PREFERRED,
				y: LayoutGrowth.FIXED
			}
		};

		// the graph frame for meter includes the custom title (and spacer)
		const graphFrame = [new LayoutComponent(
			this.model,
			this.services,
			[
				titleComponent,
				titleSpacerComponent,
				graph
			],
			{
				direction: LayoutDirection.COLUMN
			}
		)];

		// add the meter title as a top level component
		const components: any[] = this.getChartComponents(graphFrame);

		// export with tooltip
		components.push(new Tooltip(this.model, this.services));
		return components;
	}
}
