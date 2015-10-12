sap.ui.controller("view.Debitor",
{
	onPressValueRequest: function()
	{
		this._valueHelpDialog = sap.ui.xmlfragment("view.Fragment.Debitor", this);
		this.getView().addDependent(this._valueHelpDialog);

		this._valueHelpDialog.bindItems(
		{
			path: "Service>/DebitorSet",
			template: new sap.m.StandardListItem(
			{
				icon: "sap-icon://customer",
				description: "{Service>Kunnr}",
				title: "{Service>Name1}"
			})
		});

		this._valueHelpDialog.open();
	},
	
	onPressConfirmBtn: function() 
	{
	    this._valueHelpDialog.close();
	},
	onPressCancelBtn: function() 
	{
	    this._valueHelpDialog.close();
	}

	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf view.Debitor
	 */
	//	onInit: function() {
	//
	//	},

	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf view.Debitor
	 */
	//	onBeforeRendering: function() {
	//
	//	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf view.Debitor
	 */
	//	onAfterRendering: function() {
	//
	//	},

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf view.Debitor
	 */
	//	onExit: function() {
	//
	//	}

});