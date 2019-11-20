(function() {

	_.extend(OC.Files.Client, {
		PROPERTY_FILES_LOCK: '{' + OC.Files.Client.NS_NEXTCLOUD + '}lock'
	})


	var FilesPlugin = {
		attach: function(fileList) {
			var self = this

			var oldGetWebdavProperties = fileList._getWebdavProperties
			fileList._getWebdavProperties = function() {
				var props = oldGetWebdavProperties.apply(this, arguments)
				props.push(OC.Files.Client.PROPERTY_FILES_LOCK)
				return props
			}

			fileList.filesClient.addFileInfoParser(function(response) {
				var data = {}
				var props = response.propStat[0].properties
				var isLocked = props[OC.Files.Client.PROPERTY_FILES_LOCK]
				if (!_.isUndefined(isLocked) && isLocked !== '') {
					data.locked = isLocked === '1'
				}
				return data
			})

			var oldCreateRow = fileList._createRow
			fileList._createRow = function(fileData) {
				var $tr = oldCreateRow.apply(this, arguments)
				if (fileData.locked) {
					$tr.attr('data-locked', fileData.locked)
				}
				return $tr
			}


			fileList.fileActions.registerAction({
				name: 'Locking',
				displayName: function(context) {
					if (context && context.$file) {
						var locked = context.$file.data('locked')
						if (locked) {
							return t('files_lock', 'Unlock file')
						}
					}
					return t('files_lock', 'Lock file')
				},
				mime: 'all',
				order: -140,
				iconClass: 'icon-security',
				permissions: OC.PERMISSION_READ,
				actionHandler: self.switchLock
			})

			fileList.fileActions.registerAction({
				name: 'LockingInline',
				render: function(actionSpec, isDefault, context) {
					var $file = context.$file
					var locked = context.$file.data('locked')
					var $actionLink = $('<span/>')
					if (locked) {
						$actionLink.text('Locked')
					}
					context.$file.find('a.name>span.fileactions').append($actionLink)
					return $actionLink
				},
				mime: 'all',
				order: -140,
				type: OCA.Files.FileActions.TYPE_INLINE,
				permissions: OC.PERMISSION_READ,
				actionHandler: self.switchLock
			})
		},

		switchLock: function(fileName, context) {
			var fileId = context.$file.data('id')
			var locked = context.$file.data('locked')
			var model = context.fileList.getModelForFile(fileName)
			model.set('locked', !locked)
			if (locked !== undefined && locked) {
				$.ajax({
					method: 'DELETE',
					url: OC.generateUrl('/apps/files_lock/lock/' + fileId)
				}).done(function (res) {
					// success ?
				}).fail(function () {
					// error
				});
			} else {
				$.ajax({
					method: 'PUT',
					url: OC.generateUrl('/apps/files_lock/lock/' + fileId)
				}).done(function (res) {
					// success ?
				}).fail(function () {
					// error
				});
			}
		}

	};

	OC.Plugins.register('OCA.Files.FileList', FilesPlugin)

})();
