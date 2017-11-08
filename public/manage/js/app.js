const app = angular.module('dashboard', []);

app.controller('metaLabelCtrl', ($scope, $http)=>{

    $scope.createMetaLabel = createMetaLabel;
    $scope.deleteMetaLabel = deleteMetaLabel;
    $scope.selectMetaLabel = selectMetaLabel;
    $scope.assignLabel = assignLabel;
    $scope.unassignLabel = unassignLabel;

    function deleteMetaLabel(label_id) {
        const data = {
            id: label_id,
        }
        $http.post('/manage/meta_label/delete', data).then(refreshMetaLabelList);
    }
    
    function createMetaLabel() {
        const data = {
            name: $scope.new_meta_label_name,
        }
        $http.post('/manage/meta_label/create', data).then(refreshMetaLabelList);
    }

    function assignLabel(id) {
        const data = {
            mid: $scope.selected_meta_label_id,
            id: id
        }
        $http.post('/manage/label/assign', data).then(() => {
            refreshAssignedLabelList(data.mid);
            refreshUnassignedLabelList();
        })
    }

    function unassignLabel(id) {
        const data = {
            mid: $scope.selected_meta_label_id,
            id: id
        }
        $http.post('/manage/label/unassign', data).then(() => {
            refreshAssignedLabelList(data.mid)
            refreshUnassignedLabelList();
        })
    }


    function selectMetaLabel(id) {
        $scope.selected_meta_label_id = id;
        refreshAssignedLabelList(id);
        refreshUnassignedLabelList();
    }

    function refreshAssignedLabelList(id) {
        $http.post('/manage/meta_label/labels', {id: id}).then((res) => {
            $scope.assigned_labels = res.data.value;
        });
    }

    function refreshMetaLabelList() {
        $http.get('/manage/meta_label/list').then((res) => {
            $scope.meta_labels = res.data.value;
        });
    }

    function refreshUnassignedLabelList() {
        $http.get('/manage/label/unassigned/list').then((res) => {
            $scope.unassigned_labels = res.data.value;
        });
    }


    refreshMetaLabelList();
    refreshUnassignedLabelList();

})

app.controller('labelHeatmapCtrl', ($scope, $http)=>{
    function getLabels() {
        $http.get('/api/labels').then((res) => {
            $scope.labels = res.data.data;
            console.log($scope.labels[0].history)
        });
    }
    getLabels();
})