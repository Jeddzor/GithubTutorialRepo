$(document).ready(function(){
    $('.delete-fuel').on('click', function(){
        var id = $(this).data('fuel_id');
        var url = '/delete/' + id;
        if(confirm('Delete Fuel?')){
            $.ajax({
                url: url,
                type: 'DELETE',
                success: function(result){
                    console.log('Deleting Fuel Entry');
                    window.location.href='/';
                },
                error: function(err){
                    console.log(err);
                }
            });
        }
    });

    $('.edit-fuel').on('click', function(){
        $('#edit-form-type').val($(this).data('type'));
        $('#edit-form-price').val($(this).data('price'));
        $('#edit-form-octane').val($(this).data('octane'));
        $('#edit-form-id').val($(this).data('id'));
    });
});