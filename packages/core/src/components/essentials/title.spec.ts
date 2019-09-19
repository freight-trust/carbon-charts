import { getComponentContainer, TestEnvironment } from "../../tests/index";

import { Title } from "../index";

describe("title component", () => {
	beforeEach(function() {
		const testEnvironment = new TestEnvironment();
		testEnvironment.render();

		this._chart = testEnvironment.getChartReference();
		this._testEnvironment = testEnvironment;
	});

	describe("content", () => {
		it("should match text provided in options", async function(done) {
			const sampleTitle = "My chart";

			const newOptions = Object.assign(
				this._chart.model.getOptions(),
				{ title: sampleTitle }
			);

			this._chart.model.setOptions(newOptions);

			await new Promise(resolve => {
				// Add event listener for when chart render is finished
				this._chart.services.events.getDocumentFragment().addEventListener("render-finished", resolve);
			});

			const title = getComponentContainer(Title);
			expect(title.querySelector("text").innerHTML).toEqual(sampleTitle);

			done();
		});
	});

	afterEach(function() {
		this._testEnvironment.destroy();
	});
});