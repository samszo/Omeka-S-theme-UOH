<?php
namespace OmekaTheme\Helper;

use Laminas\View\Helper\AbstractHelper;

class getSumEtoile extends AbstractHelper
{
    /**
     * renvoie la somme des valeurs d'une évaluation 
     *  pour une ressource, un actant
     *
     * @params array     $params paramètre de l'action
     * @return array
     */
    public function __invoke($params){

        $api = $this->getView()->api();
        
        $hasRatingSystem = $api->search('properties', ['term' => 'ma:hasRatingSystem'])->getContent()[0];        
        $isRatingOf = $api->search('properties', ['term' => 'ma:isRatingOf'])->getContent()[0];        
        if(isset($params['hasDoc']))$hasDoc = $api->search('properties', ['term' => 'jdc:hasDoc'])->getContent()[0];        
        if(isset($params['hasActant']))$hasActant = $api->search('properties', ['term' => 'jdc:hasActant'])->getContent()[0];        

        $query = array();
        $query['property'][0]['property']= $hasRatingSystem->id()."";
        $query['property'][0]['type']='res';
        $query['property'][0]['joiner']='and';
        $query['property'][0]['text']=$params['ratingSystem'];//24831

        $query['property'][1]['property']= $isRatingOf->id()."";
        $query['property'][1]['type']='eq';
        $query['property'][1]['joiner']='and';
        $query['property'][1]['text']=$params['ratingOf'];//rateItemForLicence

        if(isset($params['hasDoc'])){
            $query['property'][2]['property']= $hasDoc->id()."";
            $query['property'][2]['type']='res';
            $query['property'][2]['joiner']='and';
            $query['property'][2]['text']=$params['hasDoc']; 
        }

        $result = $api->search('items',$query)->getContent();
        $sum = 0;
        $nb = 0;
        foreach ($result as $r) {
            $vals = $r->value('ma:hasRating',['all'=>true]);
            foreach ($vals as $v) {
                $s = $v->__toString();
                if(is_numeric($s)){
                    $sum +=  floatval($s);
                    $nb++;
                }
            }
        }
        
        return $nb ? $sum/$nb : 0;       
    }

}