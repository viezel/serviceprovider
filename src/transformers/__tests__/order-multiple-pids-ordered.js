/* eslint-disable max-len, quotes, comma-spacing, key-spacing, quote-props */
// Request: order {"pretty":true,"pids":["870970-basis:28126727","870970-basis:27597726"],"expires":"2016-08-01","library":"DK-100451","phone":"123454","address":"ADDRESS","email":"EMAIL","agencyId":"DK-100451","userId":"XXXXX","userPincode":"XXXXX","authentication.groupIdAut":"XXXXX","authentication.passwordAut":"XXXXX","authentication.userIdAut":"XXXXX","outputType":"json","serviceRequester":"190101"}
'use strict';
import Provider from '../../provider/Provider.js';
import {assert, fail} from 'chai';

let provider = Provider();
let mockData = {"[\"orderpolicy\",\"<SOAP-ENV:Envelope xmlns=\\\"http://oss.dbc.dk/ns/openorder\\\" xmlns:SOAP-ENV=\\\"http://schemas.xmlsoap.org/soap/envelope/\\\">\\n     <SOAP-ENV:Body>\\n        <placeOrderRequest>\\n           <authentication>\\n              <groupIdAut>XXXXX</groupIdAut>\\n              <passwordAut>XXXXX</passwordAut>\\n              <userIdAut>XXXXX</userIdAut>\\n           </authentication>\\n           <copy>false</copy>\\n           <exactEdition>false</exactEdition>\\n           <needBeforeDate>2016-08-01T00:00:00</needBeforeDate>\\n           <orderSystem>bibliotekdk</orderSystem>\\n           <pickUpAgencyId>DK-100451</pickUpAgencyId>\\n           <pid>870970-basis:28126727</pid>\\n           <pid>870970-basis:27597726</pid>\\n           <serviceRequester>190101</serviceRequester>\\n           <userAddress>address</userAddress>\\n           <userId>XXXXX</userId>\\n           <userIdAuthenticated>true</userIdAuthenticated>\\n           <userMail>email</userMail>\\n           \\n           <userTelephone>phone</userTelephone>\\n           <verificationReferenceSource>dbcdatawell</verificationReferenceSource>\\n           <outputType>json</outputType>\\n         </placeOrderRequest>\\n      </SOAP-ENV:Body>\\n    </SOAP-ENV:Envelope>\"]":"{\"placeOrderResponse\":{\"orderPlaced\":{\"orderId\":{\"$\":\"1022738251\"},\"orderPlacedMessage\":{\"$\":\"owned_accepted\"}}},\"@namespaces\":{\"oo\":\"http:\\/\\/oss.dbc.dk\\/ns\\/openorder\"}}"};

describe('Automated test of the order endpoint', () => {
  it('expected response. ID:4zhwq8, for {"pretty":true,"pids":["870970-basis:28126727","870970-basis:27597726"],"expires":"2016-08-01","library":"DK-100451","phone":"123454","address":"ADDRESS","email":"EMAIL","agencyId":"DK-100451","userId":"XXXXX","userPincode":"XXXXX","authentication.groupIdAut":"XXXXX","authentication.passwordAut":"XXXXX","authentication.userIdAut":"XXXXX","outputType":"json","serviceRequester":"190101"}', (done) => {
    let context = {"app":{"collectionidentifiers":"rec.collectionIdentifier:150013-palle OR rec.collectionIdentifier:758000-katalog"},"opensearch":{"url":"http://opensearch.addi.dk/b3.0_4.2/","agency":"775100","profile":"opac"},"moreinfo":{"url":"http://moreinfo.addi.dk/2.1/","user":"XXXXX","group":"XXXXX","password":"XXXXX"},"entitysuggest":{"url":"http://xptest.dbc.dk/ms/entity-suggest/v1","libraryType":"folkebibliotek"},"popsuggest":{"url":"http://xptest.dbc.dk/ms/entity-pop/v1"},"creatorsuggest":{"url":"http://xptest.dbc.dk/ms/entity-suggest/v1/creator"},"librarysuggest":{"url":"http://xptest.dbc.dk/ms/entity-suggest/v1/library","librarytype":"folkebibliotek"},"subjectsuggest":{"url":"http://xptest.dbc.dk/ms/entity-suggest/v1/subject"},"orderpolicy":{"url":"https://openorder.addi.dk/test_2.7.1/","servicerequester":"190101"},"userstatus":{"salt":"XXXXX","url":"https://openuserstatus.addi.dk/1.4.1/","userid":"XXXXX","userpin":"XXXXX","useragency":"DK-100451","authgroupid":"XXXXX","authpassword":"XXXXX","authid":"XXXXX"},"recommend":{"urls":{"default":"https://xptest.dbc.dk/ms/recommend-cosim/v1","popular":"https://xptest.dbc.dk/ms/recommend-pop/v1"}},"openagency":{"url":"http://openagency.addi.dk/2.24/","agency":"775100"},"ddbcms":{"url":"http://rest.filmstriben.dbc.inlead.dk/web/","agency":"775100","password":"XXXXX"},"openholdingstatus":{"url":"https://openholdingstatus.addi.dk/2.2/","authgroupid":"XXXXX","authpassword":"XXXXX","authid":"XXXXX"},"rank":{"url":"http://xp-p02.dbc.dk/rank"}};
    context.mockData = mockData;
    provider.execute('order', {"pretty":true,"pids":["870970-basis:28126727","870970-basis:27597726"],"expires":"2016-08-01","library":"DK-100451","phone":"123454","address":"ADDRESS","email":"EMAIL","agencyId":"DK-100451","userId":"XXXXX","userPincode":"XXXXX","authentication.groupIdAut":"XXXXX","authentication.passwordAut":"XXXXX","authentication.userIdAut":"XXXXX","outputType":"json","serviceRequester":"190101"}, context)
      .then(result => {
        assert.deepEqual(result,
            {"statusCode":200,"data":"ok"});
        done();
      })
      .catch(result => {
        fail({throw: result}, {"statusCode":200,"data":"ok"});
        done();
      });
  });
});
