CREATE PROCEDURE [CustomerPanel].[CloseOrder](@customerId int, @orderId int)
AS
BEGIN
                set nocount on;               

                begin tran;                         
     
                                delete CDN.Rezerwacje where Rez_ZrdNumer=@orderId and Rez_KntNumer=@customerId;
                               if @@error<>0 goto end_rollback;

                               update cdn.zamnag set zan_stan = 51 where zan_gidnumer = @orderId
                               if @@error<>0 goto end_rollback;

                commit tran
                select cast(1 as bit);

                end_rollback:
                rollback tran;
                select cast(0 as bit);
END

go

grant exec on [CustomerPanel].[CloseOrder] to comarchb2b
