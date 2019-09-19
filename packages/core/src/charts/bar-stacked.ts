// Internal Imports
import { AxisChart } from "../axis-chart";
import * as Configuration from "../configuration";
import {
	ChartConfig,
	ScatterChartOptions
} from "../interfaces/index";
import { Tools } from "../tools";

// Components
import {
	Grid,
	Bar,
	TwoDimensionalAxes,
	// the imports below are needed because of typescript bug (error TS4029)
	Tooltip,
	Legend,
	LayoutComponent
} from "../components/index";

export class StackedBarChart extends AxisChart {
	constructor(holder: Element, chartConfigs: ChartConfig<ScatterChartOptions>) {
		super(holder, chartConfigs);

		if (chartConfigs.options) {
			// Merge the default options for this chart
			// With the user provided options
			this.model.setOptions(
				Tools.merge(
					Tools.clone(Configuration.options.stackedBarChart),
					chartConfigs.options
				)
			);
		}
	}

	getComponents() {
		// Specify what to render inside the graph-frame
		const graphFrameComponents = [
			new TwoDimensionalAxes(this.model, this.services),
			new Grid(this.model, this.services),
			new Bar(this.model, this.services)
		];

		// Grab base axis chart components from AxisChart
		return this.getAxisChartComponents(graphFrameComponents);
	}
}