YUI.add("gallery-yui3treeview-ng-datasource", function(Y) {
	
	var getClassName = Y.ClassNameManager.getClassName,
		CONTENT_BOX = "contentBox",
		TREEVIEW_DATASOURCE = "treeviewdatasource",
		TREENODE = "treenode",
		classNames = {
			loading : getClassName(TREENODE, "loading")
		};

	/**
		* TreeView data plugin, it allows for dynamic data retreiving and loading
		* @class TreeViewDataSource
		* @constructor
		* @uses Y.DataSource
		* @extends Y.Plugin.base
		*/
	function TreeViewDataSource () {
		TreeViewDataSource.superclass.constructor.apply(this, arguments);
	};

	TreeViewDataSource.NAME = TREEVIEW_DATASOURCE;
	TreeViewDataSource.NS = "ds";

	TreeViewDataSource.ATTRS = {
		/**
			* The source URL 
			* @attribute source 
			* @type String
			*/
		source : {
			value : null
		},
		
		/**
			* The load Message to display while waiting for the new data 
			* @attribute loadingMsg
			* @type String || Y.Node
			*/
		loadingMsg: {
			value : null
		},
		
		/**
			* The JSON DataSchema
			* @attribute dataSchemaJSON
			* @type {Object}
			* @properties : resultListLocator, resultFields, metaFields. 
			*/
		dataSchemaJSON : {
			value : {
				resultListLocator : null,
				resultFields : null,
				metaFields	: null 
			}
		},
		
		/**
			* The method to use to retrieve the data
			* @attribute sourceMethod
			* @type String
			*
			* @description datasource method. Either: io, get, or local
			*/
		sourceMethod : {
			value : null,
			setter: function(val) {
				var returnVal = Y.Attribute.INVALID_VALUE;
				if (["io", "get", "local"].indexOf(val) >= 0) {
					returnVal = val;
				}
				return returnVal;
			}
		}
	};

	Y.extend(TreeViewDataSource, Y.Plugin.Base, {
		initializer : function () {
			var sourceMethod = this.get("sourceMethod"),
				dataSchemaJSON = this.get("dataSchemaJSON");
			
			this.publish('sendRequest', { 
				defaultFn: this._makeRequest
			});
			
			this.publish('onDataReturnSuccess', { 
				defaultFn: this._defSuccessHandler
			});
			
			this.publish('onDataReturnFailure', { 
				defaultFn: this._defFailureHandler
			});

			switch (sourceMethod) {
				case "io":
					this.treedatasource = new Y.DataSource.IO({source: this.get("source")});                    
					break;
				case "get":
					this.treedatasource = new Y.DataSource.Get({source: this.get("source")});                    
					break;
				case "local":
					this.treedatasource =  new Y.DataSource.Local({source: this.get("source")});
					break;
			};
			
			this.treedatasource.plug(Y.Plugin.DataSourceJSONSchema, {
				schema: {
					resultListLocator: dataSchemaJSON.resultListLocator,
					resultFields : dataSchemaJSON.resultFields
				}
			});
		},
		
		/**
		 * Default event handler for successfull data retrieval
		 * @method _defSuccessHandler
		 * @protected
		 */
		_defSuccessHandler : function(e) {
			var tree = this;

			Y.fire("onDataReturnSuccess",{data:e});
			
			tree.get(CONTENT_BOX).removeClass(classNames.loading);
			if (tree._loadingMsgNode !== null) {
				tree._loadingMsgNode.remove(true);
			}
			tree.add(e.response.results);
// 			if (tree instanceof Y.CheckBoxTreeNode) { // FIXME: handle elsewhere
// 				tree._syncChildren();
// 			}
			// FIXME: Implement
			// this.get("host").get(CONTENT_BOX).focusManager.refresh();
        },
        
		/**
		 * Default event handler for data retrieval failure
		 * @method _defFailureHandler
		 * @protected
		 */
		_defFailureHandler : function(e) {
			var tree = e.treenode;
			Y.fire("onDataSourceFailure", {data:e});
			tree.set("loadOnDemand", true);
			tree.get(CONTENT_BOX).removeClass(classNames.loading);
        },
		
		/**
		 * Default event handler for sendRequest
		 * @method _makeRequest
		 * @protected
		 */
		_makeRequest : function (e) {
			var tree = e.treenode,
				loadOnDemand = tree.get("loadOnDemand"),
				loadingMsg = this.get("loadingMsg"),
				request = e.request,
				contentBox = tree.get(CONTENT_BOX),
				callback;

			if (loadOnDemand == false) {
				return;
			}

			callback = { //FIXME: bullshit - should fire event!
				success : Y.bind(this._defSuccessHandler, tree),
				failure : Y.bind(this._defFailureHandler, tree)
			};

			tree.set("loadOnDemand", false);
			tree.removeAll();
			
			contentBox.addClass(classNames.loading);
			if (loadingMsg) {
				tree._loadingMsgNode = contentBox.appendChild(loadingMsg);
			}
			this.treedatasource.sendRequest({
				request : "?"+request,
				callback : callback
			});
        }
    });
    
    Y.namespace('Plugin.TreeView');
    Y.Plugin.TreeViewDataSource = TreeViewDataSource;

}, 'gallery-2011.01.03-18-30' ,{ requires: ["gallery-yui3-treeview-ng", "datasource", "datasource-jsonschema"]} );
