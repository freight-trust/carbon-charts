// Internal Imports
import * as Configuration from "./configuration";
import { Tools } from "./tools";
import * as colorPalettes from "./services/colorPalettes";
import { Events } from "./interfaces";

// D3
import { scaleOrdinal } from "d3-scale";

/** The charting model layer which includes mainly the chart data and options,
 * as well as some misc. information to be shared among components */
export class ChartModel {
	// Callbacks
	/**
	 * Function to be called when data or options update within the model
	 * @type Function
	 */
	protected updateCallback: Function;
	protected services: any;

	// Internal Model state
	protected state: any = {
		options: {}
	};

	// Data labels
	/**
	 * A list of all the labels that have existed within the lifetime of the chart
	 * @type string[]
	 */
	protected allDataLabels: string[];

	// Fill scales & fill related objects
	protected patternScale = {};
	protected colorScale: any = {};


	constructor(services: any) {
		this.services = services;
	}

	sanitize(data) {
		// Sanitize all dates
		data.datasets.forEach(dataset => {
			dataset.data = dataset.data.map(d => {
				if (d.date && !d.date.getTime) {
					d.date = new Date(d.date);
				}

				return d;
			});
		});

		return data;
	}

	getDisplayData() {
		const { ACTIVE } = Configuration.legend.items.status;
		const dataLabels = this.get("dataLabels");

		if (!this.get("data")) {
			return null;
		}

		// Remove datasets that have been disabled
		const displayData = Tools.clone(this.get("data"));
		displayData.datasets = displayData.datasets.filter(dataset => {
			return dataLabels[dataset.label] === ACTIVE;
		});

		return displayData;
	}

	getData() {
		return this.get("data");
	}

	/**
	 *
	 * @param newData The new raw data to be set
	 */
	setData(newData) {
		const sanitizedData = this.sanitize(Tools.clone(newData));
		const dataLabels = this.generateDataLabels(sanitizedData);

		this.set({
			data: sanitizedData,
			dataLabels
		});

		return sanitizedData;
	}

	generateDataLabels(newData) {
		const dataLabels = {};
		newData.datasets.forEach(dataset => {
			dataLabels[dataset.label] = Configuration.legend.items.status.ACTIVE;
		});

		return dataLabels;
	}

	/**
	 * @return {Object} The chart's options
	 */
	getOptions() {
		return this.state.options;
	}

	set(newState: any, skipUpdate = false) {
		this.state = Object.assign({}, this.state, newState);

		if (!skipUpdate) {
			this.update();
		}
	}

	get(property?: string) {
		if (property) {
			return this.state[property];
		} else {
			return this.state;
		}
	}

	/**
	 *
	 * @param newOptions New options to be set
	 */
	setOptions(newOptions) {
		this.set({
			options: Tools.merge(this.getOptions(), newOptions)
		});
	}

	/**
	 *
	 * Updates miscellanous information within the model
	 * such as the color scales, or the legend data labels
	 */
	update() {
		if (!this.getDisplayData()) {
			return;
		}

		this.updateAllDataLabels();
		this.setColorScale();

		this.services.events.dispatchEvent(Events.Model.UPDATE);
	}

	setUpdateCallback(cb: Function) {
		this.updateCallback = cb;
	}

	/*
	 * Data labels
	*/
	toggleDataLabel(changedLabel: string) {
		const { ACTIVE, DISABLED } = Configuration.legend.items.status;
		const dataLabels = this.get("dataLabels");

		const hasDeactivatedItems = Object.keys(dataLabels).some(label => dataLabels[label] === DISABLED);
		const activeItems = Object.keys(dataLabels).filter(label => dataLabels[label] === ACTIVE);
		// If there are deactivated items, toggle "changedLabel"
		if (hasDeactivatedItems) {
			// If the only active item is being toggled
			// Activate all items
			if (activeItems.length === 1 && activeItems[0] === changedLabel) {
				// If every item is active, then enable "changedLabel" and disable all other items
				Object.keys(dataLabels).forEach(label => {
					dataLabels[label] = ACTIVE;
				});
			} else {
				dataLabels[changedLabel] = dataLabels[changedLabel] === DISABLED ? ACTIVE : DISABLED;
			}
		} else {
			// If every item is active, then enable "changedLabel" and disable all other items
			Object.keys(dataLabels).forEach(label => {
				dataLabels[label] = (label === changedLabel ? ACTIVE : DISABLED);
			});
		}

		// dispatch legend filtering event with the status of all the dataLabels
		this.services.events.dispatchEvent(Events.Legend.ITEMS_UPDATE, {
			dataLabels
		});

		// Update model
		this.set({
			dataLabels
		});
	}

	/*
	 * Fill scales
	*/
	setColorScale() {
		if (this.getDisplayData().datasets[0].fillColors) {
			this.getDisplayData().datasets.forEach(dataset => {
				this.colorScale[dataset.label] = scaleOrdinal().range(dataset.fillColors).domain(this.allDataLabels);
			});
		} else {
			const colors = colorPalettes.DEFAULT;
			this.getData().datasets.forEach((dataset, i) => {
				this.colorScale[dataset.label] = scaleOrdinal().range([colors[i]]).domain(this.allDataLabels);
			});
		}
	}

	/**
	 * Should the data point be filled?
	 * @param datasetLabel
	 * @param label
	 * @param value
	 * @param defaultFilled the default for this chart
	 */
	getIsFilled(datasetLabel: any, label?: any, data?: any, defaultFilled?: boolean) {
		const options = this.getOptions();
		if (options.getIsFilled) {
			return options.getIsFilled(datasetLabel, label, data, defaultFilled);
		} else {
			return defaultFilled;
		}
	}

	getFillColor(datasetLabel: any, label?: any, data?: any) {
		const options = this.getOptions();
		const defaultFillColor = this.getFillScale()[datasetLabel](label);
		if (options.getFillColor) {
			return options.getFillColor(datasetLabel, label, data, defaultFillColor);
		} else {
			return defaultFillColor;
		}
	}

	getStrokeColor(datasetLabel: any, label?: any, data?: any) {
		const options = this.getOptions();
		const defaultStrokeColor = this.colorScale[datasetLabel](label);
		if (options.getStrokeColor) {
			return options.getStrokeColor(datasetLabel, label, data, defaultStrokeColor);
		} else {
			return defaultStrokeColor;
		}
	}

	getFillScale() {
		// Choose patternScale or colorScale based on the "accessibility" flag
		// return this.get("options").accessibility ? this.patternScale : this.colorScale;
		return this.colorScale;
	}


	/*
	 * Data labels
	*/
	protected updateAllDataLabels() {
		// If allDataLabels hasn't been initialized yet
		// Set it to the current set of chart labels
		if (!this.allDataLabels) {
			this.allDataLabels = this.getDisplayData().labels;
		} else {
			// Loop through current chart labels
			this.getDisplayData().labels.forEach(label => {
				// If label hasn't been stored yet, store it
				if (this.allDataLabels.indexOf(label) === -1) {
					this.allDataLabels.push(label);
				}
			});
		}
	}
}
